import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ─── Domain types ────────────────────────────────────────────────────────────

export interface LLNode {
  value: number;
  next: number | null; // index of next node, null = end of list
}

export interface LinkedListState {
  nodes: LLNode[];
  slow: number | null;
  fast: number | null;
  meetPoint: number | null;
  cycleStart: number | null;
  cycleEdge: number | null; // tail node that points back into cycle
  phase: "detecting" | "locating" | "done";
  hasCycle: boolean;
}

export interface FloydInput {
  nodes: LLNode[];
}

// ─── Default demo list (0→1→2→3→4→5→2, cycle at node 5→2) ──────────────────

const DEFAULT_INPUT: FloydInput = {
  nodes: [
    { value: 3, next: 1 }, // node 0
    { value: 1, next: 2 }, // node 1
    { value: 0, next: 3 }, // node 2
    { value: 4, next: 4 }, // node 3
    { value: 2, next: 5 }, // node 4
    { value: 6, next: 2 }, // node 5 → back to node 2 (cycle)
  ],
};

// ─── Step generator ───────────────────────────────────────────────────────────

function generateSteps(input: FloydInput): AlgorithmStep<LinkedListState>[] {
  const { nodes } = input;
  const steps: AlgorithmStep<LinkedListState>[] = [];

  const baseState = (): LinkedListState => ({
    nodes,
    slow: null,
    fast: null,
    meetPoint: null,
    cycleStart: null,
    cycleEdge: null,
    phase: "detecting",
    hasCycle: false,
  });

  // Step 1: initialization
  let slow: number | null = 0;
  let fast: number | null = 0;
  let meetPoint: number | null = null;

  steps.push({
    description: "Initialize. Slow (tortoise) = 0, Fast (hare) = 0.",
    state: { ...baseState(), slow: 0, fast: 0 },
    highlights: { "0": "active" },
    variables: { slow: 0, fast: 0 },
  });

  // Phase 1: detect cycle
  let iterCount = 0;
  const maxIter = nodes.length * 2 + 4; // safety bound

  while (iterCount++ < maxIter) {
    // Advance slow by 1
    if (slow === null || nodes[slow].next === null) {
      steps.push({
        description: "Slow pointer reached end of list. No cycle found.",
        state: { ...baseState(), slow, fast, phase: "done", hasCycle: false },
        highlights: slow !== null ? { [slow]: "active" } : {},
        variables: { slow: slow ?? "null", fast: fast ?? "null", hasCycle: false },
      });
      return steps;
    }
    slow = nodes[slow].next;

    // Advance fast by 2
    if (fast === null || nodes[fast].next === null) {
      steps.push({
        description: "Fast pointer reached end of list. No cycle found.",
        state: { ...baseState(), slow, fast, phase: "done", hasCycle: false },
        highlights: slow !== null ? { [slow]: "active" } : {},
        variables: { slow: slow ?? "null", fast: fast ?? "null", hasCycle: false },
      });
      return steps;
    }
    fast = nodes[fast].next;

    if (fast === null || nodes[fast].next === null) {
      steps.push({
        description: "Fast pointer reached end of list. No cycle found.",
        state: { ...baseState(), slow, fast, phase: "done", hasCycle: false },
        highlights: slow !== null ? { [slow]: "active" } : {},
        variables: { slow: slow ?? "null", fast: fast ?? "null", hasCycle: false },
      });
      return steps;
    }
    fast = nodes[fast].next;

    steps.push({
      description: `Move: slow→${slow} (val=${nodes[slow!].value}), fast→${fast} (val=${nodes[fast!].value}).`,
      state: {
        ...baseState(),
        slow,
        fast,
        phase: "detecting",
        hasCycle: false,
      },
      highlights: {
        [slow!]: "active",
        [fast!]: slow === fast ? "found" : "compare",
      },
      variables: {
        slow: slow!,
        "slow.value": nodes[slow!].value,
        fast: fast!,
        "fast.value": nodes[fast!].value,
      },
    });

    if (slow === fast) {
      meetPoint = slow;
      steps.push({
        description: `Slow = Fast = ${meetPoint}. Cycle detected! Phase 2: find cycle start.`,
        state: {
          ...baseState(),
          slow,
          fast,
          meetPoint,
          phase: "locating",
          hasCycle: true,
        },
        highlights: { [meetPoint!]: "found" },
        variables: { meetPoint: meetPoint!, slow: slow!, fast: fast! },
      });
      break;
    }
  }

  if (meetPoint === null) {
    // No cycle detected after max iterations (shouldn't happen with valid input)
    steps.push({
      description: "No cycle found.",
      state: { ...baseState(), slow, fast, phase: "done", hasCycle: false },
      highlights: {},
      variables: { hasCycle: false },
    });
    return steps;
  }

  // Phase 2: locate cycle start
  // Reset slow to head, keep fast at meetPoint
  slow = 0;
  fast = meetPoint;

  let cycleStart: number | null = null;
  iterCount = 0;

  while (iterCount++ < maxIter) {
    if (
      slow === null ||
      fast === null ||
      nodes[slow].next === null ||
      nodes[fast].next === null
    ) break;

    slow = nodes[slow].next;
    fast = nodes[fast].next;

    steps.push({
      description: `slow→${slow}, fast→${fast}.`,
      state: {
        ...baseState(),
        slow,
        fast,
        meetPoint,
        phase: "locating",
        hasCycle: true,
      },
      highlights: {
        [slow!]: "active",
        [fast!]: slow === fast ? "found" : "compare",
        [meetPoint!]: "visited",
      },
      variables: {
        slow: slow!,
        "slow.value": nodes[slow!].value,
        fast: fast!,
        "fast.value": nodes[fast!].value,
      },
    });

    if (slow === fast) {
      cycleStart = slow;
      break;
    }
  }

  // Find cycleEdge: the node whose next === cycleStart
  let cycleEdge: number | null = null;
  if (cycleStart !== null) {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].next === cycleStart && i !== cycleStart) {
        cycleEdge = i;
        break;
      }
    }
    // fallback: might be a self-loop or the last node before re-entry
    if (cycleEdge === null) {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].next === cycleStart) {
          cycleEdge = i;
          break;
        }
      }
    }

    steps.push({
      description: `Cycle starts at node ${cycleStart} (value=${nodes[cycleStart].value})!`,
      state: {
        nodes,
        slow: cycleStart,
        fast: cycleStart,
        meetPoint,
        cycleStart,
        cycleEdge,
        phase: "done",
        hasCycle: true,
      },
      highlights: {
        [cycleStart]: "found",
        ...(cycleEdge !== null ? { [cycleEdge]: "visited" } : {}),
      },
      variables: {
        cycleStart,
        "cycleStart.value": nodes[cycleStart].value,
        ...(cycleEdge !== null ? { cycleEdge } : {}),
      },
    });
  }

  return steps;
}

// ─── Algorithm definition ────────────────────────────────────────────────────

export const floydCycleDetection: AlgorithmDefinition<FloydInput, LinkedListState> = {
  slug: "floyd-cycle-detection",
  name: "Floyd's Cycle Detection",
  category: "graph",
  difficulty: "intermediate",
  tags: ["linked-list", "two-pointers", "tortoise-hare"],
  summary: "Detect and locate a cycle in a linked list using two pointers moving at different speeds.",
  description: `Floyd's cycle detection algorithm — the **tortoise and hare** — uses two pointers that traverse a sequence at different speeds to detect whether a cycle exists without any extra memory. The slow pointer advances one node per step while the fast pointer advances two; if a cycle is present, they are guaranteed to meet inside it.

Once a meeting point is found, the algorithm enters a second phase to **locate the cycle's entry node**. By resetting the slow pointer to the head and advancing both pointers one step at a time from their respective positions, they will meet exactly at the cycle start — a elegant consequence of the mathematical relationship between the list length and cycle length.

The algorithm runs in **O(n) time and O(1) space**, making it far superior to hash-set approaches for memory-constrained environments.`,
  realWorldUsage: [
    {
      system: "Garbage collectors (JVM, Go runtime, CPython)",
      useCase: "Detecting circular references in the object graph",
      why: "Before reclaiming memory, GC must identify objects that form reference cycles (e.g., two objects pointing to each other). Floyd's algorithm detects such cycles without allocating a visited set.",
    },
    {
      system: "Network routing protocols (RIP, OSPF)",
      useCase: "Loop detection in routing tables",
      why: "Misconfigured routers can create forwarding loops where packets circulate forever. The tortoise-and-hare approach is used in route-trace utilities to detect and report such loops efficiently.",
    },
    {
      system: "PRNG testing and cryptanalysis",
      useCase: "Finding the period of a pseudo-random sequence",
      why: "Many PRNGs produce sequences that eventually cycle. Floyd's algorithm determines the cycle length (period) and offset (rho) in O(λ+μ) time without storing the full sequence history.",
    },
  ],
  complexity: {
    time: { best: "O(n)", average: "O(n)", worst: "O(n)" },
    space: "O(1)",
  },
  related: ["dfs", "union-find"],
  implemented: true,
  defaultInput: DEFAULT_INPUT,
  generateSteps,
  code: {
    typescript: `interface ListNode {
  val: number;
  next: ListNode | null;
}

function detectCycleStart(head: ListNode | null): ListNode | null {
  if (!head) return null;

  let slow: ListNode | null = head;
  let fast: ListNode | null = head;

  // Phase 1: detect meeting point inside cycle
  while (fast !== null && fast.next !== null) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) {
      // Phase 2: find cycle entry
      slow = head;
      while (slow !== fast) {
        slow = slow!.next;
        fast = fast!.next;
      }
      return slow; // cycle start
    }
  }

  return null; // no cycle
}`,

    go: `type ListNode struct {
	Val  int
	Next *ListNode
}

func detectCycleStart(head *ListNode) *ListNode {
	slow, fast := head, head

	// Phase 1: find meeting point
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
		if slow == fast {
			// Phase 2: find cycle entry
			slow = head
			for slow != fast {
				slow = slow.Next
				fast = fast.Next
			}
			return slow
		}
	}
	return nil // no cycle
}`,

    rust: `#[derive(Debug)]
struct ListNode {
    val: i32,
    next: Option<Box<ListNode>>,
}

// Floyd's algorithm on index-based representation (avoids Rust ownership issues)
fn detect_cycle(nodes: &[(i32, Option<usize>)]) -> Option<usize> {
    if nodes.is_empty() { return None; }

    let mut slow = 0usize;
    let mut fast = 0usize;

    loop {
        slow = nodes[slow].1?;
        fast = nodes[nodes[fast].1?].1?;

        if slow == fast {
            // Phase 2: locate entry
            slow = 0;
            while slow != fast {
                slow = nodes[slow].1.unwrap();
                fast = nodes[fast].1.unwrap();
            }
            return Some(slow);
        }
    }
}`,
  },
};
