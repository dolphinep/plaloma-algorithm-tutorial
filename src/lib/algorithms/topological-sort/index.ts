import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ─── Domain types ────────────────────────────────────────────────────────────

export interface DAGNode { id: string; x: number; y: number; }
export interface DAGEdge { from: string; to: string; }

export interface TopoState {
  nodes: DAGNode[];
  edges: DAGEdge[];
  inDegree: Record<string, number>;
  queue: string[];
  result: string[];
  current: string | null;
  phase: "init" | "processing" | "done";
}

export interface TopoInput {
  nodes: DAGNode[];
  edges: DAGEdge[];
}

// ─── Default demo graph ──────────────────────────────────────────────────────

const DEFAULT_NODES: DAGNode[] = [
  { id: "A", x: 80,  y: 140 },
  { id: "B", x: 220, y: 60  },
  { id: "C", x: 220, y: 220 },
  { id: "D", x: 370, y: 60  },
  { id: "E", x: 370, y: 220 },
  { id: "F", x: 500, y: 140 },
  { id: "G", x: 580, y: 140 },
];

const DEFAULT_EDGES: DAGEdge[] = [
  { from: "A", to: "B" }, { from: "A", to: "C" },
  { from: "B", to: "D" }, { from: "C", to: "E" },
  { from: "D", to: "F" }, { from: "E", to: "F" },
  { from: "F", to: "G" },
];

const DEFAULT_INPUT: TopoInput = {
  nodes: DEFAULT_NODES,
  edges: DEFAULT_EDGES,
};

// ─── Step generator (Kahn's algorithm) ───────────────────────────────────────

function generateSteps(input: TopoInput): AlgorithmStep<TopoState>[] {
  const { nodes, edges } = input;
  const steps: AlgorithmStep<TopoState>[] = [];

  // Build adjacency list and compute in-degrees
  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  for (const node of nodes) {
    adj[node.id] = [];
    inDegree[node.id] = 0;
  }
  for (const edge of edges) {
    adj[edge.from].push(edge.to);
    inDegree[edge.to]++;
  }

  const queue: string[] = [];
  for (const node of nodes) {
    if (inDegree[node.id] === 0) queue.push(node.id);
  }

  const result: string[] = [];

  // Step 1: initialization
  steps.push({
    description: `Compute in-degrees. Queue: [${queue.join(",")}].`,
    state: {
      nodes,
      edges,
      inDegree: { ...inDegree },
      queue: [...queue],
      result: [],
      current: null,
      phase: "init",
    },
    highlights: Object.fromEntries(queue.map((id) => [id, "active" as const])),
    variables: {
      "queue size": queue.length,
      "result length": 0,
    },
  });

  // Kahn's BFS loop
  while (queue.length > 0) {
    const u = queue.shift()!;
    result.push(u);

    steps.push({
      description: `Process '${u}'. Add to result: [${result.join(",")}].`,
      state: {
        nodes,
        edges,
        inDegree: { ...inDegree },
        queue: [...queue],
        result: [...result],
        current: u,
        phase: "processing",
      },
      highlights: {
        [u]: "found",
        ...Object.fromEntries(queue.map((id) => [id, "active" as const])),
      },
      variables: {
        current: u,
        "queue size": queue.length,
        "result length": result.length,
      },
    });

    for (const v of adj[u]) {
      const oldDegree = inDegree[v];
      inDegree[v]--;
      const newDegree = inDegree[v];

      const addedToQueue = newDegree === 0;
      if (addedToQueue) queue.push(v);

      steps.push({
        description: addedToQueue
          ? `Decrement in-degree[${v}]: ${oldDegree} → ${newDegree}. '${v}' now has in-degree 0, add to queue.`
          : `Decrement in-degree[${v}]: ${oldDegree} → ${newDegree}.`,
        state: {
          nodes,
          edges,
          inDegree: { ...inDegree },
          queue: [...queue],
          result: [...result],
          current: u,
          phase: "processing",
        },
        highlights: {
          [u]: "visited" as const,
          [v]: addedToQueue ? ("active" as const) : ("compare" as const),
          ...Object.fromEntries(queue.filter((id) => id !== v).map((id) => [id, "active" as const])),
        },
        variables: {
          [`in-degree[${v}]`]: newDegree,
          "queue size": queue.length,
          "result length": result.length,
        },
      });
    }
  }

  // Final step
  const hasCycle = result.length < nodes.length;
  steps.push({
    description: hasCycle
      ? "Cycle detected! Not a valid DAG."
      : `Topological order complete: [${result.join(",")}].`,
    state: {
      nodes,
      edges,
      inDegree: { ...inDegree },
      queue: [],
      result: [...result],
      current: null,
      phase: "done",
    },
    highlights: hasCycle
      ? {}
      : Object.fromEntries(result.map((id) => [id, "sorted" as const])),
    variables: {
      "result length": result.length,
      "cycle detected": hasCycle,
    },
  });

  return steps;
}

// ─── Algorithm definition ────────────────────────────────────────────────────

export const topologicalSort: AlgorithmDefinition<TopoInput, TopoState> = {
  slug: "topological-sort",
  name: "Topological Sort",
  category: "graph",
  difficulty: "intermediate",
  tags: ["graph", "dag", "bfs", "kahn", "ordering"],
  summary: "Order nodes in a DAG so every edge points from an earlier node to a later one.",
  description: `Topological Sort produces a linear ordering of vertices in a **Directed Acyclic Graph (DAG)** such that for every directed edge u → v, vertex u appears before v in the result. Kahn's algorithm achieves this by repeatedly removing nodes whose in-degree has dropped to zero and enqueuing their successors.

The algorithm maintains an **in-degree counter** for each node and a queue of "ready" nodes (those with no remaining prerequisites). Each removal from the queue represents one resolved dependency — the node is appended to the result and its outgoing edges are relaxed.

If the result contains fewer nodes than the graph has vertices, a cycle exists and no valid ordering is possible — the algorithm serves as a cycle detector for directed graphs.`,
  realWorldUsage: [
    {
      system: "Build systems (Make / Bazel / Gradle)",
      useCase: "Task scheduling with dependencies",
      why: "Before compiling a target, all its dependencies must already be compiled. Topological sort determines the safe build order so no target is processed before its prerequisites.",
    },
    {
      system: "Package managers (npm / pip / Cargo)",
      useCase: "Dependency resolution and install order",
      why: "When installing packages, each dependency must be installed before the packages that require it. A topo sort of the dependency graph gives the correct install sequence.",
    },
    {
      system: "Database query planners (PostgreSQL / MySQL)",
      useCase: "Scheduling joins and subquery evaluation",
      why: "Query optimizers model subquery dependencies as a DAG and use topological ordering to determine which subresults must be materialized before downstream operations can execute.",
    },
  ],
  complexity: {
    time: { best: "O(V+E)", average: "O(V+E)", worst: "O(V+E)" },
    space: "O(V)",
  },
  related: ["dfs", "bfs"],
  implemented: true,
  defaultInput: DEFAULT_INPUT,
  generateSteps,
  code: {
    typescript: `function topologicalSort(graph: Map<string, string[]>): string[] | null {
  const inDegree = new Map<string, number>();
  for (const [node, neighbors] of graph) {
    if (!inDegree.has(node)) inDegree.set(node, 0);
    for (const nb of neighbors) {
      inDegree.set(nb, (inDegree.get(nb) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [node, deg] of inDegree) {
    if (deg === 0) queue.push(node);
  }

  const result: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    result.push(u);
    for (const v of graph.get(u) ?? []) {
      const newDeg = (inDegree.get(v) ?? 0) - 1;
      inDegree.set(v, newDeg);
      if (newDeg === 0) queue.push(v);
    }
  }

  // If result doesn't include every node, a cycle exists
  return result.length === inDegree.size ? result : null;
}`,

    go: `func topologicalSort(graph map[string][]string) ([]string, bool) {
	inDegree := make(map[string]int)
	for node, neighbors := range graph {
		if _, ok := inDegree[node]; !ok {
			inDegree[node] = 0
		}
		for _, nb := range neighbors {
			inDegree[nb]++
		}
	}

	queue := []string{}
	for node, deg := range inDegree {
		if deg == 0 {
			queue = append(queue, node)
		}
	}

	result := []string{}
	for len(queue) > 0 {
		u := queue[0]
		queue = queue[1:]
		result = append(result, u)
		for _, v := range graph[u] {
			inDegree[v]--
			if inDegree[v] == 0 {
				queue = append(queue, v)
			}
		}
	}

	// cycle detected if not all nodes processed
	return result, len(result) == len(inDegree)
}`,

    rust: `use std::collections::{HashMap, VecDeque};

fn topological_sort(graph: &HashMap<&str, Vec<&str>>) -> Option<Vec<String>> {
    let mut in_degree: HashMap<&str, usize> = HashMap::new();
    for (&node, neighbors) in graph {
        in_degree.entry(node).or_insert(0);
        for &nb in neighbors {
            *in_degree.entry(nb).or_insert(0) += 1;
        }
    }

    let mut queue: VecDeque<&str> = in_degree
        .iter()
        .filter(|(_, &d)| d == 0)
        .map(|(&n, _)| n)
        .collect();

    let mut result = vec![];
    while let Some(u) = queue.pop_front() {
        result.push(u.to_string());
        for &v in graph.get(u).into_iter().flatten() {
            let d = in_degree.entry(v).or_insert(0);
            *d -= 1;
            if *d == 0 {
                queue.push_back(v);
            }
        }
    }

    if result.len() == in_degree.len() { Some(result) } else { None }
}`,
  },
};
