import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ─── Domain types ────────────────────────────────────────────────────────────

export interface UnionFindState {
  elements: number[];
  parent: number[];
  rank: number[];
  components: number;
  currentOp: { type: "union" | "find"; a: number; b?: number } | null;
  activeNodes: number[];
  rootNodes: number[];
  phase: "init" | "operating" | "done";
}

export interface UFOperation {
  type: "union" | "find";
  a: number;
  b?: number;
}

export interface UnionFindInput {
  n: number;
  operations: UFOperation[];
}

// ─── Default demo input ──────────────────────────────────────────────────────

const DEFAULT_INPUT: UnionFindInput = {
  n: 8,
  operations: [
    { type: "union", a: 0, b: 1 },
    { type: "union", a: 2, b: 3 },
    { type: "union", a: 4, b: 5 },
    { type: "union", a: 6, b: 7 },
    { type: "union", a: 0, b: 2 },
    { type: "union", a: 4, b: 6 },
    { type: "find", a: 3 },
    { type: "union", a: 1, b: 5 },
  ],
};

// ─── Step generator ───────────────────────────────────────────────────────────

function generateSteps(input: UnionFindInput): AlgorithmStep<UnionFindState>[] {
  const { n, operations } = input;
  const steps: AlgorithmStep<UnionFindState>[] = [];

  const elements = Array.from({ length: n }, (_, i) => i);
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array<number>(n).fill(0);
  let components = n;

  const rootNodes = () => elements.filter((i) => parent[i] === i);

  // find with path compression (mutates parent array)
  function find(x: number): { root: number; path: number[] } {
    const path: number[] = [];
    let cur = x;
    while (parent[cur] !== cur) {
      path.push(cur);
      cur = parent[cur];
    }
    path.push(cur); // include root
    const root = cur;
    // path compression
    for (const node of path) {
      parent[node] = root;
    }
    return { root, path };
  }

  // Step 1: initialization
  steps.push({
    description: `Initialize ${n} disjoint sets. Each element is its own root.`,
    state: {
      elements: [...elements],
      parent: [...parent],
      rank: [...rank],
      components,
      currentOp: null,
      activeNodes: [],
      rootNodes: rootNodes(),
      phase: "init",
    },
    highlights: Object.fromEntries(elements.map((i) => [String(i), "active" as const])),
    variables: { components, n },
  });

  // Process each operation
  for (const op of operations) {
    if (op.type === "find") {
      const { a } = op;
      const { root, path } = find(a);

      const compressed = path.length > 2; // more than [a, ..., root]

      steps.push({
        description: `find(${a}): tracing root. path=[${path.join(",")}].`,
        state: {
          elements: [...elements],
          parent: [...parent],
          rank: [...rank],
          components,
          currentOp: { type: "find", a },
          activeNodes: [...path],
          rootNodes: rootNodes(),
          phase: "operating",
        },
        highlights: {
          ...Object.fromEntries(path.map((node) => [String(node), "active" as const])),
          [String(root)]: "found",
        },
        variables: { "find(a)": a, root, "path length": path.length },
      });

      if (compressed) {
        steps.push({
          description: `Path compression: parent[${a}] = ${root}.`,
          state: {
            elements: [...elements],
            parent: [...parent],
            rank: [...rank],
            components,
            currentOp: { type: "find", a },
            activeNodes: [a, root],
            rootNodes: rootNodes(),
            phase: "operating",
          },
          highlights: {
            [String(a)]: "compare",
            [String(root)]: "found",
          },
          variables: { [`parent[${a}]`]: root },
        });
      }

      steps.push({
        description: `find(${a}) = ${root}. Root is ${root}.`,
        state: {
          elements: [...elements],
          parent: [...parent],
          rank: [...rank],
          components,
          currentOp: { type: "find", a },
          activeNodes: [a, root],
          rootNodes: rootNodes(),
          phase: "operating",
        },
        highlights: {
          [String(a)]: "active",
          [String(root)]: "found",
        },
        variables: { result: root },
      });
    } else {
      // union
      const { a, b } = op as { type: "union"; a: number; b: number };
      const { root: ra, path: pathA } = find(a);
      const { root: rb, path: pathB } = find(b);

      if (ra === rb) {
        steps.push({
          description: `union(${a}, ${b}): roots ${ra} and ${rb}. Already in same set.`,
          state: {
            elements: [...elements],
            parent: [...parent],
            rank: [...rank],
            components,
            currentOp: { type: "union", a, b },
            activeNodes: [a, b],
            rootNodes: rootNodes(),
            phase: "operating",
          },
          highlights: {
            [String(a)]: "active",
            [String(b)]: "active",
            [String(ra)]: "found",
          },
          variables: { "root(a)": ra, "root(b)": rb, components },
        });
      } else {
        // Determine which root to attach under which (union by rank)
        let smaller: number;
        let larger: number;

        if (rank[ra] < rank[rb]) {
          parent[ra] = rb;
          smaller = ra;
          larger = rb;
        } else if (rank[ra] > rank[rb]) {
          parent[rb] = ra;
          smaller = rb;
          larger = ra;
        } else {
          parent[rb] = ra;
          rank[ra]++;
          smaller = rb;
          larger = ra;
        }
        components--;

        steps.push({
          description: `union(${a}, ${b}): roots ${ra} and ${rb}. Attach ${smaller} under ${larger}.`,
          state: {
            elements: [...elements],
            parent: [...parent],
            rank: [...rank],
            components,
            currentOp: { type: "union", a, b },
            activeNodes: [a, b, ra, rb],
            rootNodes: rootNodes(),
            phase: "operating",
          },
          highlights: {
            [String(a)]: "active",
            [String(b)]: "active",
            [String(smaller)]: "compare",
            [String(larger)]: "found",
          },
          variables: {
            "root(a)": ra,
            "root(b)": rb,
            "new root": larger,
            components,
            [`rank[${larger}]`]: rank[larger],
          },
        });

        // Apply path compression for both paths retroactively (already done inside find())
        // Emit compression steps only if paths had intermediate nodes
        const compressedA = pathA.length > 2;
        const compressedB = pathB.length > 2;
        if (compressedA || compressedB) {
          steps.push({
            description: `Path compression applied during find traversals.`,
            state: {
              elements: [...elements],
              parent: [...parent],
              rank: [...rank],
              components,
              currentOp: { type: "union", a, b },
              activeNodes: [...pathA, ...pathB].filter((v, i, arr) => arr.indexOf(v) === i),
              rootNodes: rootNodes(),
              phase: "operating",
            },
            highlights: {
              ...Object.fromEntries(pathA.map((node) => [String(node), "compare" as const])),
              ...Object.fromEntries(pathB.map((node) => [String(node), "compare" as const])),
              [String(larger)]: "found",
            },
            variables: { components },
          });
        }
      }
    }
  }

  // Final step
  steps.push({
    description: `All ${operations.length} operations complete. ${components} component(s) remain.`,
    state: {
      elements: [...elements],
      parent: [...parent],
      rank: [...rank],
      components,
      currentOp: null,
      activeNodes: [],
      rootNodes: rootNodes(),
      phase: "done",
    },
    highlights: Object.fromEntries(
      rootNodes().map((i) => [String(i), "sorted" as const])
    ),
    variables: { components, operations: operations.length },
  });

  return steps;
}

// ─── Algorithm definition ────────────────────────────────────────────────────

export const unionFind: AlgorithmDefinition<UnionFindInput, UnionFindState> = {
  slug: "union-find",
  name: "Union-Find",
  category: "data-structure",
  difficulty: "intermediate",
  tags: ["disjoint-set", "path-compression", "union-by-rank"],
  summary: "Maintain disjoint sets with near-constant time union and find operations via path compression and union by rank.",
  description: `Union-Find (also called Disjoint Set Union) is a data structure that tracks a partition of elements into disjoint sets, supporting two core operations: **find** (which set does element x belong to?) and **union** (merge the sets containing x and y). Naively, these operations can be O(n), but two optimizations bring the amortized cost to O(α(n)) — effectively constant.

**Path compression** flattens the tree during a find operation by making every node on the path from x to the root point directly to the root, drastically reducing future traversal depth. **Union by rank** always attaches the shorter tree under the taller one, bounding the tree height at O(log n) before compression even kicks in.

Together, the two optimizations yield an inverse-Ackermann time complexity α(n) — a function that is at most 4 for any input that could ever exist in practice.`,
  realWorldUsage: [
    {
      system: "Kruskal's MST algorithm",
      useCase: "Cycle detection during edge relaxation",
      why: "Kruskal's algorithm adds edges in order of weight and skips any edge whose endpoints are already in the same component. Union-Find answers this in O(α(n)) per edge, making the overall MST algorithm O(E log E).",
    },
    {
      system: "Network connectivity analysis",
      useCase: "Online queries: are nodes A and B reachable from each other?",
      why: "As new network links are established, union-find merges the connected components. Each connectivity query is answered in near-constant time by comparing the roots of the two queried nodes.",
    },
    {
      system: "Image segmentation (computer vision)",
      useCase: "Grouping adjacent pixels with similar color/intensity",
      why: "Connected-component labeling in images iterates over pixel adjacency and unions neighboring pixels that meet a similarity threshold. Union-Find processes millions of pixels efficiently in a single pass.",
    },
  ],
  complexity: {
    time: { best: "O(α(n))", average: "O(α(n))", worst: "O(α(n))" },
    space: "O(n)",
  },
  related: ["kruskal", "floyd-cycle-detection"],
  implemented: true,
  defaultInput: DEFAULT_INPUT,
  generateSteps,
  code: {
    typescript: `class UnionFind {
  private parent: number[];
  private rank: number[];
  public components: number;

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.components = n;
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // path compression
    }
    return this.parent[x];
  }

  union(a: number, b: number): boolean {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false; // already same set

    // union by rank
    if (this.rank[ra] < this.rank[rb]) this.parent[ra] = rb;
    else if (this.rank[ra] > this.rank[rb]) this.parent[rb] = ra;
    else { this.parent[rb] = ra; this.rank[ra]++; }

    this.components--;
    return true;
  }

  connected(a: number, b: number): boolean {
    return this.find(a) === this.find(b);
  }
}`,

    go: `type UnionFind struct {
	parent     []int
	rank       []int
	Components int
}

func NewUnionFind(n int) *UnionFind {
	parent := make([]int, n)
	rank := make([]int, n)
	for i := range parent { parent[i] = i }
	return &UnionFind{parent, rank, n}
}

func (uf *UnionFind) Find(x int) int {
	if uf.parent[x] != x {
		uf.parent[x] = uf.Find(uf.parent[x]) // path compression
	}
	return uf.parent[x]
}

func (uf *UnionFind) Union(a, b int) bool {
	ra, rb := uf.Find(a), uf.Find(b)
	if ra == rb { return false }

	switch {
	case uf.rank[ra] < uf.rank[rb]: uf.parent[ra] = rb
	case uf.rank[ra] > uf.rank[rb]: uf.parent[rb] = ra
	default: uf.parent[rb] = ra; uf.rank[ra]++
	}
	uf.Components--
	return true
}

func (uf *UnionFind) Connected(a, b int) bool {
	return uf.Find(a) == uf.Find(b)
}`,

    rust: `struct UnionFind {
    parent: Vec<usize>,
    rank: Vec<usize>,
    pub components: usize,
}

impl UnionFind {
    fn new(n: usize) -> Self {
        Self {
            parent: (0..n).collect(),
            rank: vec![0; n],
            components: n,
        }
    }

    fn find(&mut self, x: usize) -> usize {
        if self.parent[x] != x {
            self.parent[x] = self.find(self.parent[x]); // path compression
        }
        self.parent[x]
    }

    fn union(&mut self, a: usize, b: usize) -> bool {
        let ra = self.find(a);
        let rb = self.find(b);
        if ra == rb { return false; }

        match self.rank[ra].cmp(&self.rank[rb]) {
            std::cmp::Ordering::Less    => self.parent[ra] = rb,
            std::cmp::Ordering::Greater => self.parent[rb] = ra,
            std::cmp::Ordering::Equal   => { self.parent[rb] = ra; self.rank[ra] += 1; }
        }
        self.components -= 1;
        true
    }

    fn connected(&mut self, a: usize, b: usize) -> bool {
        self.find(a) == self.find(b)
    }
}`,
  },
};
