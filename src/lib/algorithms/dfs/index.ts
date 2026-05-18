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

  // DFS uses a stack (LIFO) — push start
  const stack: [number, number][] = [[...start] as [number, number]];
  parent.set(startKey, null);

  steps.push({
    description: `Initialize stack with start node (${start[0]},${start[1]}). DFS will explore as deep as possible before backtracking.`,
    state: {
      cells: buildGrid(input, visited, {}),
      frontier: [[...start] as [number, number]],
      current: null,
      targetFound: false,
      pathLength: null,
    },
    highlights: {},
    variables: { "stack size": 1, visited: 0 },
  });

  while (stack.length > 0) {
    const [r, c] = stack.pop()!; // LIFO — pop from top
    const k = cellKey(r, c);

    // Skip already visited (can happen because DFS may push duplicates)
    if (visited.has(k)) continue;
    visited.add(k);

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
        description: `Reached end (${end[0]},${end[1]})! Path found — ${path.length - 1} steps. Note: DFS does NOT guarantee shortest path.`,
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

    // Explore neighbors — push in reverse order so "right/down" is processed first
    const neighbors: [number, number][] = [];
    for (const [dr, dc] of [...DIRS].reverse()) {
      const nr = r + dr;
      const nc = c + dc;
      const nk = cellKey(nr, nc);
      if (
        nr >= 0 && nr < rows &&
        nc >= 0 && nc < cols &&
        !wallSet.has(nk) &&
        !visited.has(nk)
      ) {
        neighbors.push([nr, nc]);
        if (!parent.has(nk)) parent.set(nk, [r, c]);
        stack.push([nr, nc]);
      }
    }

    const frontierOverrides: Partial<Record<string, GridState["cells"][0][0]>> = {};
    for (const [sr, sc] of stack) frontierOverrides[cellKey(sr, sc)] = "frontier";
    frontierOverrides[k] = k === startKey ? "start" : "current";

    steps.push({
      description: `Pop (${r},${c}) from stack. Push ${neighbors.length} neighbor${neighbors.length !== 1 ? "s" : ""} onto stack (LIFO — will explore the last-pushed first).`,
      state: {
        cells: buildGrid(input, visited, frontierOverrides),
        frontier: [...stack].reverse().map(([sr, sc]) => [sr, sc] as [number, number]),
        current: [r, c],
        targetFound: false,
        pathLength: null,
      },
      highlights: {},
      variables: {
        current: `(${r},${c})`,
        "stack size": stack.length,
        visited: visited.size,
      },
    });
  }

  steps.push({
    description: "Stack is empty — no path exists between start and end.",
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

export const dfs: AlgorithmDefinition<GridInput, GridState> = {
  slug: "dfs",
  name: "Depth-First Search",
  category: "graph",
  difficulty: "beginner",
  tags: ["graph", "traversal", "recursive", "stack"],
  summary: "Explore as deep as possible along each branch before backtracking.",
  description: `DFS uses a **stack (LIFO)** to always explore the most recently discovered node first. It dives deep into one branch of the graph before coming back to explore alternatives — like following a hallway until you hit a dead end, then backtracking to the last junction.

Unlike BFS, DFS does **not** guarantee a shortest path. It finds *a* path, which may be longer than optimal. The advantage is that DFS uses O(h) space where h is the depth, which is better than BFS's O(w) where w is the width of the search frontier — useful for very wide graphs.

DFS is the foundation of many graph algorithms: topological sort, cycle detection, and strongly connected components all rely on it.`,
  realWorldUsage: [
    {
      system: "Compilers / build systems",
      useCase: "Topological sort of dependencies",
      why: "When compiling a project, the compiler needs to process dependencies before the files that depend on them. DFS on the dependency graph (detecting cycles and recording finish times) produces a valid build order.",
    },
    {
      system: "Git",
      useCase: "Reachability and merge-base computation",
      why: "git log, git merge, and git cherry-pick all walk the commit DAG using DFS to find common ancestors, reachable commits, or divergence points.",
    },
    {
      system: "Solvers (Sudoku, N-Queens, SAT)",
      useCase: "Backtracking search",
      why: "Constraint satisfaction problems use recursive DFS with backtracking. Try a value, go deep, if you hit a contradiction, pop back and try the next value.",
    },
    {
      system: "File systems",
      useCase: "Directory traversal (find, du, cp -r)",
      why: "Unix tools like find and du traverse directory trees depth-first — they go all the way into a subdirectory before moving on to the next sibling at the same level.",
    },
  ],
  complexity: {
    time: { best: "O(V+E)", average: "O(V+E)", worst: "O(V+E)" },
    space: "O(V)",
  },
  related: ["bfs", "topological-sort", "dijkstra"],
  implemented: true,
  defaultInput: DEFAULT_GRID,
  generateSteps,
  code: {
    typescript: `// Iterative DFS using explicit stack
function dfs(graph: Map<string, string[]>, start: string, end: string): string[] | null {
  const stack: string[] = [start];
  const visited = new Set<string>();
  const parent = new Map<string, string | null>([[start, null]]);

  while (stack.length > 0) {
    const node = stack.pop()!; // LIFO — pop from top

    if (visited.has(node)) continue;
    visited.add(node);

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
        if (!parent.has(neighbor)) parent.set(neighbor, node);
        stack.push(neighbor);
      }
    }
  }

  return null; // no path
}`,

    go: `// Iterative DFS using explicit stack
func dfs(graph map[string][]string, start, end string) []string {
	stack := []string{start}
	visited := map[string]bool{}
	parent := map[string]string{start: ""}

	for len(stack) > 0 {
		// Pop from top (LIFO)
		node := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		if visited[node] {
			continue
		}
		visited[node] = true

		if node == end {
			path := []string{}
			for cur := end; cur != ""; cur = parent[cur] {
				path = append([]string{cur}, path...)
			}
			return path
		}

		for _, neighbor := range graph[node] {
			if !visited[neighbor] {
				if _, seen := parent[neighbor]; !seen {
					parent[neighbor] = node
				}
				stack = append(stack, neighbor)
			}
		}
	}
	return nil
}`,

    rust: `use std::collections::{HashMap, HashSet};

fn dfs(graph: &HashMap<&str, Vec<&str>>, start: &str, end: &str) -> Option<Vec<String>> {
    let mut stack = vec![start];
    let mut visited = HashSet::new();
    let mut parent: HashMap<&str, Option<&str>> = HashMap::from([(start, None)]);

    while let Some(node) = stack.pop() { // LIFO
        if !visited.insert(node) {
            continue; // already processed
        }

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
            if !visited.contains(neighbor) {
                parent.entry(neighbor).or_insert(Some(node));
                stack.push(neighbor);
            }
        }
    }

    None
}`,
  },
};
