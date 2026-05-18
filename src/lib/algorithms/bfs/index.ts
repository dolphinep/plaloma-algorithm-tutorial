import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";
import {
  DEFAULT_GRID,
  DIRS,
  GridInput,
  GridState,
  buildGrid,
  cellKey,
  reconstructPath,
} from "../grid-utils";

function generateSteps(input: GridInput): AlgorithmStep<GridState>[] {
  const { rows, cols, start, end, walls } = input;
  const wallSet = new Set(walls.map(([r, c]) => cellKey(r, c)));
  const steps: AlgorithmStep<GridState>[] = [];

  const visited = new Set<string>();
  const parent = new Map<string, [number, number] | null>();
  const startKey = cellKey(start[0], start[1]);

  visited.add(startKey);
  parent.set(startKey, null);
  const queue: [number, number][] = [[...start] as [number, number]];

  // Initial state
  steps.push({
    description: `Initialize queue with start node (${start[0]},${start[1]}). Mark it visited.`,
    state: {
      cells: buildGrid(input, visited, {}),
      frontier: [[...start] as [number, number]],
      current: null,
      targetFound: false,
      pathLength: null,
    },
    highlights: {},
    variables: { "queue size": 1, visited: 1 },
  });

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const k = cellKey(r, c);

    // Found end
    if (r === end[0] && c === end[1]) {
      const path = reconstructPath(parent, start, end);
      const pathOverrides: Partial<Record<string, GridState["cells"][0][0]>> = {};
      for (const [pr, pc] of path) {
        pathOverrides[cellKey(pr, pc)] = "path";
      }
      pathOverrides[startKey] = "start";
      pathOverrides[cellKey(end[0], end[1])] = "end";

      steps.push({
        description: `Reached end (${end[0]},${end[1]})! Tracing back shortest path — ${path.length - 1} steps.`,
        state: {
          cells: buildGrid(input, visited, pathOverrides),
          frontier: [],
          current: [r, c],
          targetFound: true,
          pathLength: path.length - 1,
        },
        highlights: {},
        variables: { found: "true", "path length": path.length - 1, visited: visited.size },
      });
      return steps;
    }

    // Record current step
    const frontierOverrides: Partial<Record<string, GridState["cells"][0][0]>> = {};
    for (const [qr, qc] of queue) frontierOverrides[cellKey(qr, qc)] = "frontier";
    frontierOverrides[k] = k === startKey ? "start" : "current";

    const neighbors: [number, number][] = [];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const nk = cellKey(nr, nc);
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !wallSet.has(nk) && !visited.has(nk)) {
        neighbors.push([nr, nc]);
      }
    }

    steps.push({
      description: `Dequeue (${r},${c}). Found ${neighbors.length} unvisited neighbor${neighbors.length !== 1 ? "s" : ""}. Add to back of queue (FIFO).`,
      state: {
        cells: buildGrid(input, visited, frontierOverrides),
        frontier: queue.map(([qr, qc]) => [qr, qc] as [number, number]),
        current: [r, c],
        targetFound: false,
        pathLength: null,
      },
      highlights: {},
      variables: {
        current: `(${r},${c})`,
        "queue size": queue.length,
        visited: visited.size,
      },
    });

    // Enqueue neighbors
    for (const [nr, nc] of neighbors) {
      const nk = cellKey(nr, nc);
      visited.add(nk);
      parent.set(nk, [r, c]);
      queue.push([nr, nc]);
    }
  }

  steps.push({
    description: "Queue is empty — no path exists between start and end.",
    state: {
      cells: buildGrid(input, visited, {}),
      frontier: [],
      current: null,
      targetFound: false,
      pathLength: null,
    },
    highlights: {},
    variables: { found: "false", visited: visited.size },
  });

  return steps;
}

export const bfs: AlgorithmDefinition<GridInput, GridState> = {
  slug: "bfs",
  name: "Breadth-First Search",
  category: "graph",
  difficulty: "beginner",
  tags: ["graph", "traversal", "shortest-path", "queue"],
  summary: "Explore all neighbors at the current depth before going deeper.",
  description: `BFS uses a **queue (FIFO)** to explore nodes level by level — all nodes at distance 1 first, then distance 2, and so on. This guarantees that the **first time** you reach the destination, it's via the shortest path (in terms of number of edges).

The key data structure is the queue. When you visit a node, you add all its unvisited neighbors to the **back** of the queue. The next node processed is always the one that's been waiting the longest — so you always finish one "wave" before starting the next.

BFS is optimal for unweighted graphs. For weighted graphs, use Dijkstra's algorithm instead.`,
  realWorldUsage: [
    {
      system: "Social networks (LinkedIn, Facebook)",
      useCase: "Degrees of separation / friend suggestions",
      why: "BFS finds all people within N connections. LinkedIn's 'People you may know' explores the graph level by level — 1st connections, then 2nd, then 3rd — which is exactly BFS.",
    },
    {
      system: "Web crawlers (Googlebot)",
      useCase: "Crawling pages level by level",
      why: "Google's crawler starts from seed URLs and explores outgoing links breadth-first, ensuring pages close to the seed are indexed before deeper, less-authoritative pages.",
    },
    {
      system: "Network routing (STP)",
      useCase: "Spanning Tree Protocol",
      why: "STP uses BFS from the root bridge to compute the shortest path to every switch and block redundant links — preventing broadcast storms in Ethernet networks.",
    },
    {
      system: "Game AI / Puzzle solvers",
      useCase: "Shortest path in grid games",
      why: "Pac-Man ghost AI and tile-based game pathfinding use BFS on the grid to find the minimum number of moves to reach the player. BFS guarantees optimal move count.",
    },
  ],
  complexity: {
    time: { best: "O(V+E)", average: "O(V+E)", worst: "O(V+E)" },
    space: "O(V)",
  },
  related: ["dfs", "dijkstra", "a-star"],
  implemented: true,
  defaultInput: DEFAULT_GRID,
  generateSteps,
  code: {
    typescript: `function bfs(graph: Map<string, string[]>, start: string, end: string): string[] | null {
  const queue: string[] = [start];
  const visited = new Set<string>([start]);
  const parent = new Map<string, string | null>([[start, null]]);

  while (queue.length > 0) {
    const node = queue.shift()!; // FIFO — dequeue from front

    if (node === end) {
      // Reconstruct path
      const path: string[] = [];
      let cur: string | null = end;
      while (cur !== null) {
        path.unshift(cur);
        cur = parent.get(cur) ?? null;
      }
      return path;
    }

    for (const neighbor of graph.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, node);
        queue.push(neighbor); // enqueue to back
      }
    }
  }

  return null; // no path
}`,

    go: `func bfs(graph map[string][]string, start, end string) []string {
	queue := []string{start}
	visited := map[string]bool{start: true}
	parent := map[string]string{start: ""}

	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:] // dequeue from front (FIFO)

		if node == end {
			// Reconstruct path
			path := []string{}
			for cur := end; cur != ""; cur = parent[cur] {
				path = append([]string{cur}, path...)
			}
			return path
		}

		for _, neighbor := range graph[node] {
			if !visited[neighbor] {
				visited[neighbor] = true
				parent[neighbor] = node
				queue = append(queue, neighbor)
			}
		}
	}
	return nil // no path
}`,

    rust: `use std::collections::{HashMap, HashSet, VecDeque};

fn bfs(graph: &HashMap<&str, Vec<&str>>, start: &str, end: &str) -> Option<Vec<String>> {
    let mut queue = VecDeque::from([start]);
    let mut visited = HashSet::from([start]);
    let mut parent: HashMap<&str, Option<&str>> = HashMap::from([(start, None)]);

    while let Some(node) = queue.pop_front() { // FIFO
        if node == end {
            // Reconstruct path
            let mut path = vec![];
            let mut cur = Some(end);
            while let Some(n) = cur {
                path.push(n.to_string());
                cur = *parent.get(n).unwrap();
            }
            path.reverse();
            return Some(path);
        }

        for &neighbor in graph.get(node).into_iter().flatten() {
            if visited.insert(neighbor) {
                parent.insert(neighbor, Some(node));
                queue.push_back(neighbor);
            }
        }
    }

    None // no path
}`,
  },
};
