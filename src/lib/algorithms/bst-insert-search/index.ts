import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface BSTNode {
  id: number;
  value: number;
  left: number | null;
  right: number | null;
  x: number;
  y: number;
  state: "default" | "active" | "found" | "inserted" | "comparing";
}

interface BSTState {
  nodes: BSTNode[];
  root: number | null;
  operation: "insert" | "search" | null;
  target: number | null;
  path: number[];
  found: boolean | null;
  phase: "traversing" | "done";
}

type BSTInput = {
  insertValues: number[];
  searchTarget: number;
};

// Compute x/y positions for each node using an in-order rank approach.
// Root at (310, 30); each level adds 70px vertically.
// Horizontal spread is computed by traversal-order rank within each level.
function computePositions(
  nodes: Omit<BSTNode, "x" | "y">[],
  root: number | null
): Map<number, { x: number; y: number }> {
  const positions = new Map<number, { x: number; y: number }>();

  // Count total nodes to compute spacing
  function countSubtree(id: number | null): number {
    if (id === null) return 0;
    const n = nodes.find((n) => n.id === id)!;
    return 1 + countSubtree(n.left) + countSubtree(n.right);
  }

  function assign(id: number | null, xMin: number, xMax: number, depth: number): void {
    if (id === null) return;
    const node = nodes.find((n) => n.id === id)!;
    const xMid = (xMin + xMax) / 2;
    positions.set(id, { x: xMid, y: 30 + depth * 70 });
    assign(node.left, xMin, xMid, depth + 1);
    assign(node.right, xMid, xMax, depth + 1);
  }

  void countSubtree; // suppress unused warning — kept for documentation
  assign(root, 0, 620, 0);
  return positions;
}

function applyPositions(
  nodes: Omit<BSTNode, "x" | "y">[],
  positions: Map<number, { x: number; y: number }>
): BSTNode[] {
  return nodes.map((n) => {
    const pos = positions.get(n.id) ?? { x: 310, y: 30 };
    return { ...n, x: pos.x, y: pos.y };
  });
}

function generateSteps(input: BSTInput): AlgorithmStep<BSTState>[] {
  const { insertValues, searchTarget } = input;
  const steps: AlgorithmStep<BSTState>[] = [];

  // Mutable BST state (no x/y yet — positions recomputed each step)
  let nextId = 0;
  let root: number | null = null;
  const nodeMap = new Map<number, Omit<BSTNode, "x" | "y">>();

  function snapshot(
    operation: BSTState["operation"],
    target: number | null,
    path: number[],
    found: boolean | null,
    phase: BSTState["phase"],
    activeStates: Map<number, BSTNode["state"]>,
    description: string,
    variables?: Record<string, string | number | boolean>
  ): void {
    const rawNodes = Array.from(nodeMap.values());
    const positions = computePositions(rawNodes, root);
    const nodes: BSTNode[] = applyPositions(rawNodes, positions).map((n) => ({
      ...n,
      state: activeStates.get(n.id) ?? "default",
    }));
    steps.push({
      description,
      state: { nodes, root, operation, target, path: [...path], found, phase },
      highlights: Object.fromEntries(
        Array.from(activeStates.entries()).map(([id, st]) => [
          id,
          st === "comparing" ? "compare" : st === "found" ? "found" : st === "inserted" ? "sorted" : "active",
        ])
      ),
      variables,
    });
  }

  // ── Insertions ───────────────────────────────────────────────────────────
  for (const value of insertValues) {
    const path: number[] = [];
    const activeStates = new Map<number, BSTNode["state"]>();

    if (root === null) {
      // Insert as root
      const id = nextId++;
      nodeMap.set(id, { id, value, left: null, right: null, state: "default" });
      root = id;
      activeStates.set(id, "inserted");
      snapshot("insert", value, [id], null, "done", activeStates,
        `Insert ${value}: tree is empty — place as root.`,
        { inserted: value, nodeId: id });
    } else {
      // Traverse to insertion point
      let current: number | null = root;
      let parent: number | null = null;
      let direction: "left" | "right" | null = null;

      while (current !== null) {
        path.push(current);
        activeStates.set(current, "comparing");

        snapshot("insert", value, path, null, "traversing", new Map(activeStates),
          `Insert ${value}: compare with node ${nodeMap.get(current)!.value}. ` +
          `${value < nodeMap.get(current)!.value ? "Go left." : "Go right."}`,
          { comparing: nodeMap.get(current)!.value, target: value });

        parent = current;
        const parentNode: Omit<BSTNode, "x" | "y"> = nodeMap.get(current)!;
        if (value < parentNode.value) {
          direction = "left";
          current = parentNode.left;
        } else {
          direction = "right";
          current = parentNode.right;
        }
      }

      // Insert new node
      const id = nextId++;
      nodeMap.set(id, { id, value, left: null, right: null, state: "default" });

      const parentNode = nodeMap.get(parent!)!;
      if (direction === "left") {
        nodeMap.set(parent!, { ...parentNode, left: id });
      } else {
        nodeMap.set(parent!, { ...parentNode, right: id });
      }

      activeStates.set(id, "inserted");
      // Dim traversal path
      for (const pid of path) activeStates.set(pid, "active");

      snapshot("insert", value, [...path, id], null, "done", new Map(activeStates),
        `Insert ${value}: place as ${direction} child of ${nodeMap.get(parent!)!.value}.`,
        { inserted: value, parent: nodeMap.get(parent!)!.value, direction: direction ?? "none" });
    }

    // Reset to default
    activeStates.clear();
    snapshot("insert", null, [], null, "done", activeStates,
      `Node ${value} inserted. Tree now has ${nodeMap.size} node${nodeMap.size !== 1 ? "s" : ""}.`);
  }

  // ── Search ───────────────────────────────────────────────────────────────
  {
    const path: number[] = [];
    let current: number | null = root;
    const activeStates = new Map<number, BSTNode["state"]>();

    snapshot("search", searchTarget, [], null, "traversing", activeStates,
      `Search for ${searchTarget}: start at root.`,
      { target: searchTarget });

    while (current !== null) {
      const node = nodeMap.get(current)!;
      path.push(current);
      activeStates.set(current, "comparing");

      if (node.value === searchTarget) {
        activeStates.set(current, "found");
        snapshot("search", searchTarget, path, true, "done", new Map(activeStates),
          `Found ${searchTarget} at node ${current}!`,
          { target: searchTarget, foundAt: current });
        break;
      }

      snapshot("search", searchTarget, path, null, "traversing", new Map(activeStates),
        `Compare ${searchTarget} with ${node.value}: ${searchTarget < node.value ? "go left" : "go right"}.`,
        { comparing: node.value, target: searchTarget });

      activeStates.set(current, "active");

      if (searchTarget < node.value) {
        current = node.left;
      } else {
        current = node.right;
      }
    }

    if (current === null) {
      snapshot("search", searchTarget, path, false, "done", activeStates,
        `${searchTarget} not found in the BST.`,
        { target: searchTarget, result: "not found" });
    }
  }

  return steps;
}

export const bstInsertSearch: AlgorithmDefinition<BSTInput, BSTState> = {
  slug: "bst-insert-search",
  name: "BST Insert & Search",
  category: "tree",
  difficulty: "intermediate",
  tags: ["binary-search-tree", "tree", "insert", "search", "recursive"],
  summary: "Build a Binary Search Tree by inserting values one by one, then search for a target.",
  description: `A **Binary Search Tree (BST)** maintains the invariant that for every node, all values in the left subtree are smaller and all values in the right subtree are larger. This property enables O(log n) average-case insertion and search.

**Insertion**: Start at the root and compare the new value to each node. Go left if smaller, right if larger, until an empty slot is found.

**Search**: Follow the same comparison logic — the BST property guarantees you never need to explore both subtrees.

Worst-case degrades to O(n) for sorted input (a "stick" tree). Self-balancing variants like AVL trees and Red-Black trees avoid this.`,
  realWorldUsage: [
    {
      system: "Database engines",
      useCase: "Index structures",
      why: "BSTs underpin B-trees used in MySQL InnoDB and PostgreSQL for indexed column lookups. The ordering property ensures range queries scan only relevant subtrees.",
    },
    {
      system: "Standard library maps",
      useCase: "std::map / TreeMap",
      why: "C++ std::map and Java TreeMap are implemented as red-black trees (balanced BSTs), providing O(log n) ordered key-value operations.",
    },
    {
      system: "File systems",
      useCase: "Directory trees",
      why: "ext4 uses HTree (hash-tree, a BST variant) for large directory lookups, replacing linear scans with O(log n) filename resolution.",
    },
  ],
  complexity: {
    time: { best: "O(log n)", average: "O(log n)", worst: "O(n)" },
    space: "O(n)",
    inPlace: false,
  },
  related: ["avl-tree", "red-black-tree", "binary-search", "heap"],
  implemented: true,
  defaultInput: { insertValues: [5, 3, 7, 1, 4, 6, 8], searchTarget: 4 },
  generateSteps,
  code: {
    typescript: `class BSTNode {
  constructor(
    public value: number,
    public left: BSTNode | null = null,
    public right: BSTNode | null = null
  ) {}
}

class BST {
  root: BSTNode | null = null;

  insert(value: number): void {
    if (!this.root) { this.root = new BSTNode(value); return; }
    let cur = this.root;
    while (true) {
      if (value < cur.value) {
        if (!cur.left) { cur.left = new BSTNode(value); return; }
        cur = cur.left;
      } else {
        if (!cur.right) { cur.right = new BSTNode(value); return; }
        cur = cur.right;
      }
    }
  }

  search(value: number): BSTNode | null {
    let cur = this.root;
    while (cur) {
      if (cur.value === value) return cur;
      cur = value < cur.value ? cur.left : cur.right;
    }
    return null;
  }
}

const bst = new BST();
[5, 3, 7, 1, 4, 6, 8].forEach(v => bst.insert(v));
console.log(bst.search(4));  // BSTNode { value: 4, ... }
console.log(bst.search(9));  // null`,

    go: `package main

import "fmt"

type BSTNode struct {
	Value       int
	Left, Right *BSTNode
}

func insert(root *BSTNode, value int) *BSTNode {
	if root == nil {
		return &BSTNode{Value: value}
	}
	if value < root.Value {
		root.Left = insert(root.Left, value)
	} else {
		root.Right = insert(root.Right, value)
	}
	return root
}

func search(root *BSTNode, value int) *BSTNode {
	if root == nil || root.Value == value {
		return root
	}
	if value < root.Value {
		return search(root.Left, value)
	}
	return search(root.Right, value)
}

func main() {
	var root *BSTNode
	for _, v := range []int{5, 3, 7, 1, 4, 6, 8} {
		root = insert(root, v)
	}
	fmt.Println(search(root, 4))  // &{4 <nil> <nil>}
	fmt.Println(search(root, 9))  // <nil>
}`,

    rust: `#[derive(Debug)]
struct BSTNode {
    value: i32,
    left: Option<Box<BSTNode>>,
    right: Option<Box<BSTNode>>,
}

impl BSTNode {
    fn new(value: i32) -> Self {
        BSTNode { value, left: None, right: None }
    }

    fn insert(&mut self, value: i32) {
        if value < self.value {
            match &mut self.left {
                Some(l) => l.insert(value),
                None => self.left = Some(Box::new(BSTNode::new(value))),
            }
        } else {
            match &mut self.right {
                Some(r) => r.insert(value),
                None => self.right = Some(Box::new(BSTNode::new(value))),
            }
        }
    }

    fn search(&self, value: i32) -> Option<&BSTNode> {
        if self.value == value { return Some(self); }
        if value < self.value {
            self.left.as_ref()?.search(value)
        } else {
            self.right.as_ref()?.search(value)
        }
    }
}

fn main() {
    let mut root = BSTNode::new(5);
    for v in [3, 7, 1, 4, 6, 8] { root.insert(v); }
    println!("{:?}", root.search(4));  // Some(BSTNode { value: 4, ... })
    println!("{:?}", root.search(9));  // None
}`,
  },
};
