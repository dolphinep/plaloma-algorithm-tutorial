import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ─── Domain types ────────────────────────────────────────────────────────────

export interface WGNode { id: string; x: number; y: number; }
export interface WGEdge { from: string; to: string; weight: number; }

export interface DijkstraInput {
  nodes: WGNode[];
  edges: WGEdge[];    // treated as UNDIRECTED (both directions)
  start: string;
  end: string;
}

export interface DijkstraState {
  nodes: WGNode[];
  edges: WGEdge[];
  distances: Record<string, number>;           // Infinity represented as 1e9
  visitedArr: string[];                         // visited nodes in order
  frontier: Array<{ id: string; dist: number }>; // current priority queue contents
  current: string | null;
  path: string[];                               // final shortest path (empty until found)
  parent: Record<string, string | null>;
}

// ─── Default demo graph ──────────────────────────────────────────────────────

const DEFAULT_INPUT: DijkstraInput = {
  start: "A",
  end: "G",
  nodes: [
    { id: "A", x: 60,  y: 150 },
    { id: "B", x: 200, y: 70  },
    { id: "C", x: 200, y: 230 },
    { id: "D", x: 370, y: 70  },
    { id: "E", x: 370, y: 230 },
    { id: "F", x: 520, y: 150 },
    { id: "G", x: 650, y: 150 },
  ],
  edges: [
    { from: "A", to: "B", weight: 4 },
    { from: "A", to: "C", weight: 2 },
    { from: "B", to: "C", weight: 1 },
    { from: "B", to: "D", weight: 5 },
    { from: "C", to: "E", weight: 10 },
    { from: "D", to: "E", weight: 2 },
    { from: "D", to: "F", weight: 2 },
    { from: "E", to: "F", weight: 3 },
    { from: "F", to: "G", weight: 1 },
  ],
};

// ─── Step generator ──────────────────────────────────────────────────────────

function generateSteps(input: DijkstraInput): AlgorithmStep<DijkstraState>[] {
  const { nodes, edges, start, end } = input;
  const steps: AlgorithmStep<DijkstraState>[] = [];

  // Build adjacency: undirected — each edge adds both directions
  const adj = new Map<string, Array<{ to: string; weight: number }>>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.from)!.push({ to: e.to,   weight: e.weight });
    adj.get(e.to)!.push(  { to: e.from, weight: e.weight });
  }

  // State
  const dist: Record<string, number>      = {};
  const parent: Record<string, string | null> = {};
  const visited: string[] = [];

  for (const n of nodes) {
    dist[n.id]   = 1e9;
    parent[n.id] = null;
  }
  dist[start] = 0;

  // Priority queue — sorted array, smallest dist first
  let pq: Array<{ id: string; dist: number }> = [{ id: start, dist: 0 }];

  const snapshot = (
    current: string | null,
    description: string,
    path: string[] = [],
    variables?: Record<string, string | number | boolean>
  ): AlgorithmStep<DijkstraState> => ({
    description,
    state: {
      nodes,
      edges,
      distances: { ...dist },
      visitedArr: [...visited],
      frontier: pq.map(e => ({ ...e })),
      current,
      path: [...path],
      parent: { ...parent },
    },
    highlights: {},
    variables,
  });

  // ── Step 1: Init ──────────────────────────────────────────────────────────
  steps.push(
    snapshot(
      null,
      `Initialize distances. Set dist[${start}]=0, all others=∞. Add ${start} to priority queue.`,
      [],
      { "dist[start]": 0, "PQ size": 1 }
    )
  );

  // ── Main loop ─────────────────────────────────────────────────────────────
  while (pq.length > 0) {
    // Pop minimum
    pq.sort((a, b) => a.dist - b.dist);
    const { id: u, dist: uDist } = pq.shift()!;

    // Already visited with a shorter distance — skip
    if (visited.includes(u)) {
      steps.push(
        snapshot(
          u,
          `Skip ${u} — already visited with shorter distance.`,
          [],
          { skipped: u }
        )
      );
      continue;
    }

    // Mark visited
    visited.push(u);

    // Reached the destination
    if (u === end) {
      // Reconstruct shortest path
      const path: string[] = [];
      let cur: string | null = end;
      while (cur !== null) {
        path.unshift(cur);
        cur = parent[cur];
      }

      steps.push(
        snapshot(
          u,
          `Reached ${end}! Shortest distance: ${uDist}. Path: ${path.join(" → ")}.`,
          path,
          { "shortest dist": uDist, "path length": path.length - 1 }
        )
      );
      return steps;
    }

    // Process node
    steps.push(
      snapshot(
        u,
        `Process ${u} (dist=${uDist}). Explore neighbors.`,
        [],
        { current: u, "dist[current]": uDist, visited: visited.length }
      )
    );

    // Relax edges
    for (const { to: v, weight: w } of adj.get(u) ?? []) {
      if (visited.includes(v)) continue;

      const newDist = uDist + w;
      const currentBest = dist[v] === 1e9 ? "∞" : dist[v];
      let description =
        `Check edge ${u}→${v} (weight ${w}). New path cost: ${uDist} + ${w} = ${newDist}. Current best: ${currentBest}.`;

      if (newDist < dist[v]) {
        dist[v]   = newDist;
        parent[v] = u;
        pq.push({ id: v, dist: newDist });
        description += ` Update dist[${v}] = ${newDist}.`;
      }

      steps.push(
        snapshot(
          u,
          description,
          [],
          { [`dist[${v}]`]: dist[v], "PQ size": pq.length }
        )
      );
    }
  }

  // PQ exhausted without reaching end
  steps.push(
    snapshot(
      null,
      `Priority queue is empty — no path exists from ${start} to ${end}.`,
      [],
      { found: false }
    )
  );

  return steps;
}

// ─── Algorithm definition ────────────────────────────────────────────────────

export const dijkstra: AlgorithmDefinition<DijkstraInput, DijkstraState> = {
  slug: "dijkstra",
  name: "Dijkstra's Algorithm",
  category: "graph",
  difficulty: "intermediate",
  tags: ["graph", "shortest-path", "greedy", "weighted", "priority-queue"],
  summary: "Find the shortest path between nodes in a weighted graph by always relaxing the cheapest known edge first.",

  description: `Dijkstra's algorithm finds the shortest path from a source node to every other node in a graph with non-negative edge weights. It works by **greedily relaxing edges**: at each step it picks the unvisited node with the smallest tentative distance, then updates the distances to its neighbors if a cheaper route is found through it. This greedy choice is safe because all edge weights are non-negative — once a node is settled, no future relaxation can improve its distance.

Unlike BFS, which treats all edges as having equal cost, Dijkstra accounts for weight differences. A naive BFS on a weighted graph would find the fewest-hop path, not the cheapest one — the two can be completely different. The **priority queue** (min-heap) is the key data structure: it allows the algorithm to always pull the globally cheapest unfinished node in O(log V) time, giving an overall complexity of O((V + E) log V) with a binary heap.

The algorithm terminates as soon as the destination node is popped from the priority queue, at which point its tentative distance is finalized and the shortest path can be reconstructed by following parent pointers back to the source. The trade-off versus Bellman-Ford is that Dijkstra is faster but cannot handle negative-weight edges; for those, Bellman-Ford or SPFA must be used instead.`,

  realWorldUsage: [
    {
      system: "GPS navigation (Google Maps / Waze)",
      useCase: "Turn-by-turn shortest or fastest route computation",
      why: "Road networks are weighted graphs where edge weights represent travel time or distance. Dijkstra (or its A* variant with a heuristic) is run on a compressed graph of road segments to find the optimal route in milliseconds, even across continent-scale maps.",
    },
    {
      system: "OSPF routing protocol",
      useCase: "Computing the shortest-path tree inside an autonomous system",
      why: "Open Shortest Path First is the dominant interior gateway protocol in enterprise and ISP networks. Every router runs Dijkstra on its local link-state database to build a forwarding table that sends each packet along the cheapest path measured in link cost.",
    },
    {
      system: "Network packet routing in ISPs",
      useCase: "Traffic engineering and MPLS label-switched path selection",
      why: "ISPs use Dijkstra-based Constrained Shortest Path First (CSPF) to pre-compute explicit traffic-engineering tunnels that satisfy bandwidth and latency constraints, directing large flows along least-cost paths while avoiding congested or expensive links.",
    },
  ],

  complexity: {
    time: { best: "O((V+E) log V)", average: "O((V+E) log V)", worst: "O((V+E) log V)" },
    space: "O(V)",
  },

  related: ["bfs", "a-star", "bellman-ford"],
  implemented: true,
  defaultInput: DEFAULT_INPUT,
  generateSteps,

  code: {
    typescript: `// Simple O(V²) version — clear for learning; swap sorted array for a real heap in prod
function dijkstra(
  nodes: string[],
  edges: { from: string; to: string; weight: number }[],
  start: string,
  end: string
): { dist: number; path: string[] } {
  const INF = Infinity;
  const dist: Record<string, number>       = Object.fromEntries(nodes.map(n => [n, INF]));
  const parent: Record<string, string | null> = Object.fromEntries(nodes.map(n => [n, null]));
  const visited = new Set<string>();

  // Adjacency list (undirected)
  const adj = new Map<string, Array<{ to: string; w: number }>>();
  for (const n of nodes) adj.set(n, []);
  for (const { from, to, weight } of edges) {
    adj.get(from)!.push({ to, w: weight });
    adj.get(to)!.push({ to: from, w: weight });
  }

  dist[start] = 0;
  // Priority queue as sorted array
  let pq: Array<{ id: string; d: number }> = [{ id: start, d: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.d - b.d);
    const { id: u, d: uDist } = pq.shift()!;

    if (visited.has(u)) continue;
    visited.add(u);

    if (u === end) break;

    for (const { to: v, w } of adj.get(u)!) {
      if (visited.has(v)) continue;
      const nd = uDist + w;
      if (nd < dist[v]) {
        dist[v]   = nd;
        parent[v] = u;
        pq.push({ id: v, d: nd });
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  for (let cur: string | null = end; cur !== null; cur = parent[cur]) {
    path.unshift(cur);
  }

  return { dist: dist[end], path: dist[end] === INF ? [] : path };
}`,

    go: `package main

import (
	"container/heap"
	"fmt"
	"math"
)

type Edge struct{ to int; weight int }

// Min-heap of (dist, node) pairs
type Item struct{ node, dist int }
type PQ []Item

func (pq PQ) Len() int            { return len(pq) }
func (pq PQ) Less(i, j int) bool  { return pq[i].dist < pq[j].dist }
func (pq PQ) Swap(i, j int)       { pq[i], pq[j] = pq[j], pq[i] }
func (pq *PQ) Push(x any)         { *pq = append(*pq, x.(Item)) }
func (pq *PQ) Pop() any           { old := *pq; n := len(old); x := old[n-1]; *pq = old[:n-1]; return x }

func dijkstra(graph [][]Edge, src, dst, n int) (int, []int) {
	dist   := make([]int, n)
	parent := make([]int, n)
	for i := range dist { dist[i] = math.MaxInt64; parent[i] = -1 }
	dist[src] = 0

	pq := &PQ{{src, 0}}
	heap.Init(pq)

	for pq.Len() > 0 {
		cur := heap.Pop(pq).(Item)
		u, d := cur.node, cur.dist
		if d > dist[u] { continue } // stale entry

		if u == dst { break }

		for _, e := range graph[u] {
			if nd := d + e.weight; nd < dist[e.to] {
				dist[e.to]   = nd
				parent[e.to] = u
				heap.Push(pq, Item{e.to, nd})
			}
		}
	}

	// Reconstruct path
	if dist[dst] == math.MaxInt64 { return -1, nil }
	path := []int{}
	for cur := dst; cur != -1; cur = parent[cur] {
		path = append([]int{cur}, path...)
	}
	return dist[dst], path
}

func main() {
	// Example: 5 nodes, 0-indexed
	graph := make([][]Edge, 5)
	add := func(u, v, w int) {
		graph[u] = append(graph[u], Edge{v, w})
		graph[v] = append(graph[v], Edge{u, w})
	}
	add(0, 1, 4); add(0, 2, 2); add(1, 2, 1)
	add(1, 3, 5); add(2, 4, 10); add(3, 4, 2)

	d, path := dijkstra(graph, 0, 4, 5)
	fmt.Println("dist:", d, "path:", path)
}`,

    rust: `use std::cmp::Reverse;
use std::collections::BinaryHeap;

fn dijkstra(
    graph: &Vec<Vec<(usize, u64)>>, // graph[u] = [(v, weight)]
    src: usize,
    dst: usize,
) -> Option<(u64, Vec<usize>)> {
    let n = graph.len();
    let mut dist   = vec![u64::MAX; n];
    let mut parent = vec![usize::MAX; n];
    dist[src] = 0;

    // BinaryHeap is a max-heap; wrap in Reverse for min-heap behaviour
    let mut heap = BinaryHeap::new();
    heap.push(Reverse((0u64, src)));

    while let Some(Reverse((d, u))) = heap.pop() {
        if d > dist[u] { continue; } // stale entry
        if u == dst { break; }

        for &(v, w) in &graph[u] {
            let nd = d + w;
            if nd < dist[v] {
                dist[v]   = nd;
                parent[v] = u;
                heap.push(Reverse((nd, v)));
            }
        }
    }

    if dist[dst] == u64::MAX {
        return None;
    }

    // Reconstruct path via parent pointers
    let mut path = vec![];
    let mut cur = dst;
    while cur != usize::MAX {
        path.push(cur);
        cur = parent[cur];
    }
    path.reverse();

    Some((dist[dst], path))
}

fn main() {
    // 5 nodes: 0-A 1-B 2-C 3-D 4-G (weights match demo graph)
    let mut graph = vec![vec![]; 5];
    let add = |g: &mut Vec<Vec<(usize, u64)>>, u, v, w| {
        g[u].push((v, w));
        g[v].push((u, w));
    };
    add(&mut graph, 0, 1, 4);
    add(&mut graph, 0, 2, 2);
    add(&mut graph, 1, 2, 1);
    add(&mut graph, 1, 3, 5);
    add(&mut graph, 3, 4, 2);

    if let Some((d, path)) = dijkstra(&graph, 0, 4) {
        println!("dist={d}  path={path:?}");
    }
}`,
  },
};
