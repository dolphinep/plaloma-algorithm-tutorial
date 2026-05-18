import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface SegTreeNode {
  id: number;      // 0-indexed (root=0, children of i are 2i+1, 2i+2)
  lo: number;
  hi: number;
  value: number | null;
  x: number;
  y: number;
  state: "default" | "active" | "found" | "updating" | "querying";
}

interface SegmentTreeState {
  nodes: SegTreeNode[];
  original: number[];
  current: number | null;
  queryRange: [number, number] | null;
  updateIndex: number | null;
  operation: "build" | "query" | "update" | null;
  result: number | null;
  phase: "processing" | "done";
}

// SVG layout constants
const SVG_WIDTH = 620;
const Y_LEVELS = [30, 80, 130, 180];
// Horizontal spacing per level (full-width spacing for the deepest expected level)
const X_SPACING = [SVG_WIDTH, 150, 75, 37];

/**
 * For a 6-element array the tree has at most 4 levels (depth 0-3).
 * We pre-compute x/y for up to 32 nodes (enough for depth 0-4).
 *
 * Node id: 0-indexed, root=0, left child of i = 2i+1, right child = 2i+2.
 * A node at depth d has an inorder position within its level (0-based).
 * We compute x by centering the level's nodes within SVG_WIDTH.
 */
function nodeX(id: number): number {
  // depth = floor(log2(id+1))
  const depth = Math.floor(Math.log2(id + 1));
  // position within level (0-based)
  const pos = id - (Math.pow(2, depth) - 1);
  const count = Math.pow(2, depth); // nodes at this depth

  if (depth === 0) return SVG_WIDTH / 2; // 310

  // Use the defined X_SPACING for known depths, fall back to formula
  const spacing = depth < X_SPACING.length ? X_SPACING[depth] : 37 / Math.pow(2, depth - 3);
  const totalWidth = spacing * (count - 1);
  const startX = (SVG_WIDTH - totalWidth) / 2;
  return Math.round(startX + pos * spacing);
}

function nodeY(id: number): number {
  const depth = Math.floor(Math.log2(id + 1));
  return depth < Y_LEVELS.length ? Y_LEVELS[depth] : Y_LEVELS[Y_LEVELS.length - 1] + (depth - Y_LEVELS.length + 1) * 40;
}

/**
 * Build the node skeleton (lo/hi ranges, x/y positions) for n elements.
 * Returns an array of SegTreeNode with value=null and state="default".
 */
function buildSkeleton(n: number): SegTreeNode[] {
  const nodes: SegTreeNode[] = [];

  function recurse(id: number, lo: number, hi: number): void {
    nodes.push({
      id,
      lo,
      hi,
      value: null,
      x: nodeX(id),
      y: nodeY(id),
      state: "default",
    });
    if (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      recurse(2 * id + 1, lo, mid);
      recurse(2 * id + 2, mid + 1, hi);
    }
  }

  recurse(0, 0, n - 1);
  return nodes;
}

/**
 * Deep-clone a nodes array so steps capture immutable snapshots.
 */
function cloneNodes(nodes: SegTreeNode[]): SegTreeNode[] {
  return nodes.map((n) => ({ ...n }));
}

function setNodeStates(
  nodes: SegTreeNode[],
  stateMap: Map<number, SegTreeNode["state"]>,
): void {
  for (const node of nodes) {
    node.state = stateMap.get(node.id) ?? "default";
  }
}

function generateSteps(input: { array: number[] }): AlgorithmStep<SegmentTreeState>[] {
  const { array } = input;
  const n = array.length;
  const steps: AlgorithmStep<SegmentTreeState>[] = [];

  // Working node array (mutated in place; cloned for each step snapshot)
  const nodes = buildSkeleton(n);

  // ── PHASE 1: Build (top-down construction) ──────────────────────────────────

  steps.push({
    description: `Build a sum segment tree over [${array.join(", ")}] (${n} elements, 0-indexed). Root covers the full range [0, ${n - 1}]. Each internal node stores the sum of its child ranges.`,
    state: {
      nodes: cloneNodes(nodes),
      original: [...array],
      current: null,
      queryRange: null,
      updateIndex: null,
      operation: "build",
      result: null,
      phase: "processing",
    },
    highlights: {},
    variables: { n, operation: "build" },
  });

  // Recursive build; fills node values and records one step per node (post-order)
  function buildTree(id: number, lo: number, hi: number): number {
    const nodeIdx = nodes.findIndex((nd) => nd.id === id);

    // Mark as active (being computed)
    nodes[nodeIdx].state = "active";

    steps.push({
      description: `Processing node ${id} covering range [${lo}, ${hi}]. ${lo === hi ? `Leaf node: value = array[${lo}] = ${array[lo]}.` : `Will sum left [${lo}, ${Math.floor((lo + hi) / 2)}] and right [${Math.floor((lo + hi) / 2) + 1}, ${hi}].`}`,
      state: {
        nodes: cloneNodes(nodes),
        original: [...array],
        current: id,
        queryRange: null,
        updateIndex: null,
        operation: "build",
        result: null,
        phase: "processing",
      },
      highlights: { [id]: "active" },
      variables: { nodeId: id, lo, hi },
    });

    let val: number;
    if (lo === hi) {
      val = array[lo];
    } else {
      const mid = Math.floor((lo + hi) / 2);
      const leftVal = buildTree(2 * id + 1, lo, mid);
      const rightVal = buildTree(2 * id + 2, mid + 1, hi);
      val = leftVal + rightVal;
    }

    nodes[nodeIdx].value = val;
    nodes[nodeIdx].state = "found";

    steps.push({
      description: `Node ${id} [${lo}, ${hi}] assigned value ${val}. ${lo === hi ? `Leaf.` : `Sum of children: ${val}.`}`,
      state: {
        nodes: cloneNodes(nodes),
        original: [...array],
        current: id,
        queryRange: null,
        updateIndex: null,
        operation: "build",
        result: null,
        phase: "processing",
      },
      highlights: { [id]: "found" },
      variables: { nodeId: id, lo, hi, value: val },
    });

    nodes[nodeIdx].state = "default";
    return val;
  }

  buildTree(0, 0, n - 1);

  // Freeze all nodes as "default" after build
  for (const nd of nodes) nd.state = "default";

  steps.push({
    description: `Build complete. Root node (id=0) holds total sum = ${nodes[0].value}. The tree is ready for O(log n) queries and updates.`,
    state: {
      nodes: cloneNodes(nodes),
      original: [...array],
      current: null,
      queryRange: null,
      updateIndex: null,
      operation: "build",
      result: nodes[0].value,
      phase: "done",
    },
    highlights: { 0: "found" },
    variables: { totalSum: nodes[0].value ?? 0 },
  });

  // Snapshot of values after build (used for later phases)
  const builtValues = nodes.map((nd) => nd.value);

  // ── PHASE 2: Range sum query [1, 4] (0-indexed) ────────────────────────────

  const qL = 1;
  const qR = 4;

  // Reset node states
  for (const nd of nodes) nd.state = "default";

  steps.push({
    description: `Query: sum of elements in range [${qL}, ${qR}] (0-indexed). Traverse the tree; at each node check if its range is fully inside, partially overlapping, or outside [${qL}, ${qR}].`,
    state: {
      nodes: cloneNodes(nodes),
      original: [...array],
      current: null,
      queryRange: [qL, qR],
      updateIndex: null,
      operation: "query",
      result: null,
      phase: "processing",
    },
    highlights: {},
    variables: { queryL: qL, queryR: qR },
  });

  let queryResult = 0;

  function queryTree(id: number, lo: number, hi: number, l: number, r: number): number {
    const nodeIdx = nodes.findIndex((nd) => nd.id === id);

    if (r < lo || hi < l) {
      // No overlap
      steps.push({
        description: `Node ${id} [${lo}, ${hi}]: no overlap with query [${l}, ${r}]. Return 0.`,
        state: {
          nodes: cloneNodes(nodes),
          original: [...array],
          current: id,
          queryRange: [qL, qR],
          updateIndex: null,
          operation: "query",
          result: null,
          phase: "processing",
        },
        highlights: { [id]: "visited" as never },
        variables: { nodeId: id, lo, hi, overlap: "none" },
      });
      return 0;
    }

    if (l <= lo && hi <= r) {
      // Full overlap — use this node's value
      nodes[nodeIdx].state = "found";

      steps.push({
        description: `Node ${id} [${lo}, ${hi}]: fully inside query [${l}, ${r}]. Use value ${nodes[nodeIdx].value}. Return ${nodes[nodeIdx].value}.`,
        state: {
          nodes: cloneNodes(nodes),
          original: [...array],
          current: id,
          queryRange: [qL, qR],
          updateIndex: null,
          operation: "query",
          result: null,
          phase: "processing",
        },
        highlights: { [id]: "found" },
        variables: { nodeId: id, lo, hi, value: nodes[nodeIdx].value ?? 0, overlap: "full" },
      });

      return nodes[nodeIdx].value ?? 0;
    }

    // Partial overlap — recurse
    nodes[nodeIdx].state = "querying";

    steps.push({
      description: `Node ${id} [${lo}, ${hi}]: partial overlap with query [${l}, ${r}]. Recurse into both children.`,
      state: {
        nodes: cloneNodes(nodes),
        original: [...array],
        current: id,
        queryRange: [qL, qR],
        updateIndex: null,
        operation: "query",
        result: null,
        phase: "processing",
      },
      highlights: { [id]: "active" },
      variables: { nodeId: id, lo, hi, overlap: "partial" },
    });

    const mid = Math.floor((lo + hi) / 2);
    const leftVal = queryTree(2 * id + 1, lo, mid, l, r);
    const rightVal = queryTree(2 * id + 2, mid + 1, hi, l, r);
    nodes[nodeIdx].state = "default";
    return leftVal + rightVal;
  }

  queryResult = queryTree(0, 0, n - 1, qL, qR);

  steps.push({
    description: `Query complete. Sum of range [${qL}, ${qR}] = ${queryResult}. Verified: ${array.slice(qL, qR + 1).join(" + ")} = ${array.slice(qL, qR + 1).reduce((a, b) => a + b, 0)}.`,
    state: {
      nodes: cloneNodes(nodes),
      original: [...array],
      current: null,
      queryRange: [qL, qR],
      updateIndex: null,
      operation: "query",
      result: queryResult,
      phase: "done",
    },
    highlights: {},
    variables: { result: queryResult },
  });

  // ── PHASE 3: Point update — set index 2 to value 10 ────────────────────────

  const updateIdx = 2;   // 0-indexed
  const newValue = 10;
  const delta = newValue - array[updateIdx]; // 10 - 5 = 5

  // Restore node values and states from builtValues
  for (const nd of nodes) {
    nd.value = builtValues[nd.id] ?? null;
    nd.state = "default";
  }

  steps.push({
    description: `Update: set array[${updateIdx}] from ${array[updateIdx]} to ${newValue} (delta = +${delta}). Walk from root to the leaf covering index ${updateIdx}, adding ${delta} to each node on the path.`,
    state: {
      nodes: cloneNodes(nodes),
      original: [...array],
      current: null,
      queryRange: null,
      updateIndex: updateIdx,
      operation: "update",
      result: null,
      phase: "processing",
    },
    highlights: {},
    variables: { updateIdx, newValue, delta },
  });

  function updateTree(id: number, lo: number, hi: number, pos: number, d: number): void {
    const nodeIdx = nodes.findIndex((nd) => nd.id === id);

    nodes[nodeIdx].state = "updating";

    steps.push({
      description: `Node ${id} [${lo}, ${hi}]: on update path to index ${pos}. Current value = ${nodes[nodeIdx].value}. Adding delta ${d} → ${(nodes[nodeIdx].value ?? 0) + d}.`,
      state: {
        nodes: cloneNodes(nodes),
        original: [...array],
        current: id,
        queryRange: null,
        updateIndex: updateIdx,
        operation: "update",
        result: null,
        phase: "processing",
      },
      highlights: { [id]: "active" },
      variables: { nodeId: id, lo, hi, before: nodes[nodeIdx].value ?? 0, delta: d },
    });

    nodes[nodeIdx].value = (nodes[nodeIdx].value ?? 0) + d;
    nodes[nodeIdx].state = "found";

    steps.push({
      description: `Node ${id} [${lo}, ${hi}] updated to ${nodes[nodeIdx].value}.${lo === hi ? " Reached leaf." : ""}`,
      state: {
        nodes: cloneNodes(nodes),
        original: [...array],
        current: id,
        queryRange: null,
        updateIndex: updateIdx,
        operation: "update",
        result: null,
        phase: lo === hi ? "done" : "processing",
      },
      highlights: { [id]: "found" },
      variables: { nodeId: id, newValue: nodes[nodeIdx].value },
    });

    if (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      nodes[nodeIdx].state = "default";
      if (pos <= mid) {
        updateTree(2 * id + 1, lo, mid, pos, d);
      } else {
        updateTree(2 * id + 2, mid + 1, hi, pos, d);
      }
    }
  }

  updateTree(0, 0, n - 1, updateIdx, delta);

  const updatedOriginal = [...array];
  updatedOriginal[updateIdx] = newValue;

  // Final state: reset all to default except updated path highlight
  for (const nd of nodes) {
    if (nd.state !== "found") nd.state = "default";
  }

  steps.push({
    description: `Update complete. array[${updateIdx}] is now ${newValue}. Root sum updated to ${nodes[0].value}. All ancestor nodes have been correctly adjusted.`,
    state: {
      nodes: cloneNodes(nodes),
      original: updatedOriginal,
      current: null,
      queryRange: null,
      updateIndex: updateIdx,
      operation: "update",
      result: nodes[0].value,
      phase: "done",
    },
    highlights: { 0: "found" },
    variables: { updatedIndex: updateIdx, newValue, newRootSum: nodes[0].value ?? 0 },
  });

  return steps;
}

export const segmentTree: AlgorithmDefinition<{ array: number[] }, SegmentTreeState> = {
  slug: "segment-tree",
  name: "Segment Tree",
  category: "data-structure",
  difficulty: "advanced",
  tags: ["tree", "range-query", "point-update", "sum", "divide-and-conquer"],
  summary: "A binary tree enabling O(log n) range queries and point updates over an array.",
  description: `A **Segment Tree** is a binary tree where each node stores aggregate information (e.g. sum, min, max) over a contiguous sub-array (segment). The root covers the full array \`[0, n-1]\`. Each internal node \`i\` covers a range \`[lo, hi]\` and its children cover \`[lo, mid]\` and \`[mid+1, hi]\` where \`mid = ⌊(lo+hi)/2⌋\`.

**Build**: O(n) — fill each leaf with the corresponding array element, then each internal node gets the combined value of its children.

**Query**: O(log n) — at each node, if the query range fully contains the node's range, return its stored value; if no overlap, return the identity (0 for sum); otherwise recurse into both children.

**Update**: O(log n) — walk from root to the target leaf, updating each node on the path.`,
  realWorldUsage: [
    {
      system: "Apache Spark / distributed query engines",
      useCase: "Range aggregate queries on partitioned data",
      why: "Segment-tree-like partition trees are used internally when planning range-aggregate queries over time-series or sorted numeric columns, collapsing partition statistics in O(log n) steps.",
    },
    {
      system: "Competitive programming",
      useCase: "Range min/max/sum with lazy propagation",
      why: "Segment trees (often with lazy propagation) handle interval update + range query problems — the workhorse for problems like 'range add, range sum' on Codeforces/LeetCode.",
    },
    {
      system: "GIS / spatial databases",
      useCase: "1-D interval stabbing / coverage queries",
      why: "Segment trees underlie efficient 1-D interval stabbing queries; PostGIS and R-tree variants use the same divide-and-conquer principle for 2-D rectangles.",
    },
    {
      system: "Text editors (rope data structure)",
      useCase: "Character count / line count in ranges",
      why: "The rope used in editors like VS Code aggregates character/line counts at each internal node — equivalent to a segment tree supporting O(log n) range count and O(log n) insert/delete.",
    },
  ],
  complexity: {
    time: { best: "O(n)", average: "O(log n)", worst: "O(log n)" },
    space: "O(n)",
    inPlace: false,
  },
  related: ["fenwick-tree", "sparse-table", "merge-sort"],
  implemented: true,
  defaultInput: { array: [1, 3, 5, 7, 9, 11] },
  generateSteps,
  code: {
    typescript: `class SegmentTree {
  private tree: number[];
  private n: number;

  constructor(arr: number[]) {
    this.n = arr.length;
    this.tree = new Array(4 * this.n).fill(0);
    this.build(arr, 0, 0, this.n - 1);
  }

  private build(arr: number[], node: number, lo: number, hi: number): void {
    if (lo === hi) {
      this.tree[node] = arr[lo];
      return;
    }
    const mid = Math.floor((lo + hi) / 2);
    this.build(arr, 2 * node + 1, lo, mid);
    this.build(arr, 2 * node + 2, mid + 1, hi);
    this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
  }

  query(l: number, r: number, node = 0, lo = 0, hi = this.n - 1): number {
    if (r < lo || hi < l) return 0;
    if (l <= lo && hi <= r) return this.tree[node];
    const mid = Math.floor((lo + hi) / 2);
    return (
      this.query(l, r, 2 * node + 1, lo, mid) +
      this.query(l, r, 2 * node + 2, mid + 1, hi)
    );
  }

  update(pos: number, val: number, node = 0, lo = 0, hi = this.n - 1): void {
    if (lo === hi) { this.tree[node] = val; return; }
    const mid = Math.floor((lo + hi) / 2);
    if (pos <= mid) this.update(pos, val, 2 * node + 1, lo, mid);
    else            this.update(pos, val, 2 * node + 2, mid + 1, hi);
    this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2];
  }
}

const st = new SegmentTree([1, 3, 5, 7, 9, 11]);
console.log(st.query(1, 4)); // 24 (3+5+7+9)
st.update(2, 10);
console.log(st.query(1, 4)); // 29 (3+10+7+9)`,

    go: `package main

import "fmt"

type SegTree struct {
	tree []int
	n    int
}

func NewSegTree(arr []int) *SegTree {
	n := len(arr)
	st := &SegTree{tree: make([]int, 4*n), n: n}
	st.build(arr, 0, 0, n-1)
	return st
}

func (st *SegTree) build(arr []int, node, lo, hi int) {
	if lo == hi {
		st.tree[node] = arr[lo]
		return
	}
	mid := (lo + hi) / 2
	st.build(arr, 2*node+1, lo, mid)
	st.build(arr, 2*node+2, mid+1, hi)
	st.tree[node] = st.tree[2*node+1] + st.tree[2*node+2]
}

func (st *SegTree) Query(l, r int) int {
	return st.query(0, 0, st.n-1, l, r)
}

func (st *SegTree) query(node, lo, hi, l, r int) int {
	if r < lo || hi < l {
		return 0
	}
	if l <= lo && hi <= r {
		return st.tree[node]
	}
	mid := (lo + hi) / 2
	return st.query(2*node+1, lo, mid, l, r) +
		st.query(2*node+2, mid+1, hi, l, r)
}

func (st *SegTree) Update(pos, val int) {
	st.update(0, 0, st.n-1, pos, val)
}

func (st *SegTree) update(node, lo, hi, pos, val int) {
	if lo == hi {
		st.tree[node] = val
		return
	}
	mid := (lo + hi) / 2
	if pos <= mid {
		st.update(2*node+1, lo, mid, pos, val)
	} else {
		st.update(2*node+2, mid+1, hi, pos, val)
	}
	st.tree[node] = st.tree[2*node+1] + st.tree[2*node+2]
}

func main() {
	st := NewSegTree([]int{1, 3, 5, 7, 9, 11})
	fmt.Println(st.Query(1, 4)) // 24
	st.Update(2, 10)
	fmt.Println(st.Query(1, 4)) // 29
}`,

    rust: `struct SegTree {
    tree: Vec<i64>,
    n: usize,
}

impl SegTree {
    fn new(arr: &[i64]) -> Self {
        let n = arr.len();
        let mut st = SegTree { tree: vec![0; 4 * n], n };
        st.build(arr, 0, 0, n - 1);
        st
    }

    fn build(&mut self, arr: &[i64], node: usize, lo: usize, hi: usize) {
        if lo == hi {
            self.tree[node] = arr[lo];
            return;
        }
        let mid = (lo + hi) / 2;
        self.build(arr, 2 * node + 1, lo, mid);
        self.build(arr, 2 * node + 2, mid + 1, hi);
        self.tree[node] = self.tree[2 * node + 1] + self.tree[2 * node + 2];
    }

    fn query(&self, l: usize, r: usize) -> i64 {
        self.q(0, 0, self.n - 1, l, r)
    }

    fn q(&self, node: usize, lo: usize, hi: usize, l: usize, r: usize) -> i64 {
        if r < lo || hi < l { return 0; }
        if l <= lo && hi <= r { return self.tree[node]; }
        let mid = (lo + hi) / 2;
        self.q(2 * node + 1, lo, mid, l, r) + self.q(2 * node + 2, mid + 1, hi, l, r)
    }

    fn update(&mut self, pos: usize, val: i64) {
        self.upd(0, 0, self.n - 1, pos, val);
    }

    fn upd(&mut self, node: usize, lo: usize, hi: usize, pos: usize, val: i64) {
        if lo == hi { self.tree[node] = val; return; }
        let mid = (lo + hi) / 2;
        if pos <= mid { self.upd(2 * node + 1, lo, mid, pos, val); }
        else          { self.upd(2 * node + 2, mid + 1, hi, pos, val); }
        self.tree[node] = self.tree[2 * node + 1] + self.tree[2 * node + 2];
    }
}

fn main() {
    let mut st = SegTree::new(&[1, 3, 5, 7, 9, 11]);
    println!("{}", st.query(1, 4)); // 24
    st.update(2, 10);
    println!("{}", st.query(1, 4)); // 29
}`,
  },
};
