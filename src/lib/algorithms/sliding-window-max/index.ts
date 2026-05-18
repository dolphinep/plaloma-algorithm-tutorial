import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ── Local state type ─────────────────────────────────────────────────────────
interface SlidingWindowMaxState {
  array: number[];
  k: number;
  deque: number[];
  windowStart: number;
  windowEnd: number;
  result: number[];
  current: number | null;
  phase: "processing" | "done";
}

// ── Input ────────────────────────────────────────────────────────────────────
interface SlidingWindowMaxInput {
  array: number[];
  k: number;
}

const DEFAULT_SLIDING_WINDOW_MAX_INPUT: SlidingWindowMaxInput = {
  array: [1, 3, -1, -3, 5, 3, 6, 7],
  k: 3,
};

// ── Step generator ───────────────────────────────────────────────────────────
function generateSteps(
  input: SlidingWindowMaxInput
): AlgorithmStep<SlidingWindowMaxState>[] {
  const { array, k } = input;
  const n = array.length;
  const steps: AlgorithmStep<SlidingWindowMaxState>[] = [];

  const deque: number[] = [];
  const result: number[] = [];

  const snap = (
    description: string,
    current: number | null,
    windowStart: number,
    windowEnd: number,
    phase: "processing" | "done",
    extra?: Record<string, string | number>
  ): AlgorithmStep<SlidingWindowMaxState> => ({
    description,
    state: {
      array,
      k,
      deque: [...deque],
      windowStart,
      windowEnd,
      result: [...result],
      current,
      phase,
    },
    highlights:
      current !== null
        ? { [current]: "active" }
        : {},
    variables: {
      k,
      windowStart,
      windowEnd,
      dequeIndices: deque.join(","),
      ...extra,
    },
  });

  // Init step
  steps.push(
    snap(
      `Find max in every window of size ${k} using a monotonic deque. Array length = ${n}.`,
      null,
      0,
      k - 1,
      "processing"
    )
  );

  for (let i = 0; i < n; i++) {
    const windowStart = Math.max(0, i - k + 1);
    const windowEnd = i;

    // Remove front if out of window
    while (deque.length > 0 && deque[0] <= i - k) {
      const removed = deque.shift()!;
      steps.push(
        snap(
          `Remove index ${removed} from deque front (arr[${removed}]=${array[removed]} is no longer in window [${windowStart}..${i}]).`,
          i,
          windowStart,
          windowEnd,
          "processing",
          { removed }
        )
      );
    }

    // Pop from back while back element is ≤ current
    while (deque.length > 0 && array[deque[deque.length - 1]] <= array[i]) {
      const popped = deque.pop()!;
      steps.push(
        snap(
          `Pop index ${popped} from deque back (arr[${popped}]=${array[popped]} ≤ arr[${i}]=${array[i]} — can never be a window max).`,
          i,
          windowStart,
          windowEnd,
          "processing",
          { popped }
        )
      );
    }

    // Push current index
    deque.push(i);
    steps.push(
      snap(
        `Add index ${i} (value ${array[i]}) to deque. Deque: [${deque.join(",")}].`,
        i,
        windowStart,
        windowEnd,
        "processing",
        { "arr[i]": array[i] }
      )
    );

    // Record result when first full window is complete
    if (i >= k - 1) {
      const windowMax = array[deque[0]];
      result.push(windowMax);
      steps.push(
        snap(
          `Window [${windowStart}..${i}] = [${array.slice(windowStart, i + 1).join(",")}]. Max = arr[${deque[0]}] = ${windowMax}. Results so far: [${result.join(", ")}].`,
          i,
          windowStart,
          windowEnd,
          "processing",
          { windowMax, "results count": result.length }
        )
      );
    }
  }

  steps.push(
    snap(
      `All windows processed. Maximums: [${result.join(", ")}].`,
      null,
      n - k,
      n - 1,
      "done",
      { "result length": result.length }
    )
  );

  return steps;
}

// ── Export ───────────────────────────────────────────────────────────────────
export const slidingWindowMax: AlgorithmDefinition<
  SlidingWindowMaxInput,
  SlidingWindowMaxState
> = {
  slug: "sliding-window-max",
  name: "Sliding Window Maximum",
  category: "searching",
  difficulty: "intermediate",
  tags: ["deque", "sliding-window", "monotonic"],
  summary:
    "Find the maximum element in every contiguous subarray of size k in linear time using a monotonic deque.",

  description: `Sliding Window Maximum finds the largest value in each contiguous subarray of fixed size k across an entire array. A naive approach — rescanning k elements per window — costs O(nk). The key insight is to maintain a monotonic decreasing deque of indices: elements that can never be a future window maximum are discarded eagerly, so each index is added and removed at most once.

The deque stores indices in decreasing order of their array values. When the window slides forward, the front element is evicted if it has fallen outside the window boundary. Before adding a new element, all back elements with values ≤ the new value are popped, because they are dominated and will never be the maximum of any future window.

The result for window ending at index i (once i ≥ k-1) is always arr[deque[0]] — the front of the deque, which holds the index of the current window's maximum.

This O(n) technique generalises to sliding window minimum, range queries, and is the backbone of many stock analysis and stream-processing algorithms.`,

  realWorldUsage: [
    {
      system: "Stock price rolling maximum",
      useCase:
        "Computing the highest price over a rolling trading window",
      why: "Financial analytics dashboards compute rolling N-day highs over millions of ticks. The monotonic deque reduces this from O(nk) to O(n), making real-time dashboards feasible at high-frequency tick resolution without approximation.",
    },
    {
      system: "Video stream frame analysis",
      useCase:
        "Finding peak brightness or motion intensity in a sliding temporal window",
      why: "Video processing pipelines (scene cut detection, HDR tone-mapping) need per-frame statistics over a temporal neighbourhood. The deque-based sliding maximum processes full HD/4K frame sequences at native frame rates in a single pass.",
    },
    {
      system: "Network traffic burst detection",
      useCase:
        "Identifying peak packet counts in a sliding time window for QoS enforcement",
      why: "Network traffic shapers and DDoS mitigation systems enforce per-flow burst limits by tracking the maximum packet rate over a sliding window. The O(n) algorithm lets hardware offload engines evaluate millions of flows per second.",
    },
  ],

  complexity: {
    time: { best: "O(n)", average: "O(n)", worst: "O(n)" },
    space: "O(k)",
  },

  related: ["two-sum", "kadane"],
  implemented: true,
  defaultInput: DEFAULT_SLIDING_WINDOW_MAX_INPUT,
  generateSteps,

  code: {
    typescript: `function slidingWindowMax(arr: number[], k: number): number[] {
  const n = arr.length;
  const deque: number[] = []; // stores indices
  const result: number[] = [];

  for (let i = 0; i < n; i++) {
    // Remove indices outside the current window
    while (deque.length > 0 && deque[0] <= i - k) deque.shift();

    // Maintain decreasing order — pop dominated elements from back
    while (deque.length > 0 && arr[deque[deque.length - 1]] <= arr[i]) {
      deque.pop();
    }

    deque.push(i);

    // Record max once the first full window is complete
    if (i >= k - 1) result.push(arr[deque[0]]);
  }

  return result;
}

// Usage
console.log(slidingWindowMax([1, 3, -1, -3, 5, 3, 6, 7], 3));
// [3, 3, 5, 5, 6, 7]`,

    go: `package main

import "fmt"

func slidingWindowMax(arr []int, k int) []int {
	n := len(arr)
	deque := make([]int, 0, k) // stores indices
	result := make([]int, 0, n-k+1)

	for i := 0; i < n; i++ {
		// Evict out-of-window front
		for len(deque) > 0 && deque[0] <= i-k {
			deque = deque[1:]
		}
		// Pop dominated back elements
		for len(deque) > 0 && arr[deque[len(deque)-1]] <= arr[i] {
			deque = deque[:len(deque)-1]
		}

		deque = append(deque, i)

		if i >= k-1 {
			result = append(result, arr[deque[0]])
		}
	}

	return result
}

func main() {
	fmt.Println(slidingWindowMax([]int{1, 3, -1, -3, 5, 3, 6, 7}, 3))
	// [3 3 5 5 6 7]
}`,

    rust: `use std::collections::VecDeque;

fn sliding_window_max(arr: &[i32], k: usize) -> Vec<i32> {
    let n = arr.len();
    let mut deque: VecDeque<usize> = VecDeque::new();
    let mut result = Vec::with_capacity(n - k + 1);

    for i in 0..n {
        // Evict out-of-window front
        while deque.front().map_or(false, |&f| f + k <= i) {
            deque.pop_front();
        }
        // Pop dominated back elements
        while deque.back().map_or(false, |&b| arr[b] <= arr[i]) {
            deque.pop_back();
        }

        deque.push_back(i);

        if i >= k - 1 {
            result.push(arr[*deque.front().unwrap()]);
        }
    }

    result
}

fn main() {
    println!("{:?}", sliding_window_max(&[1, 3, -1, -3, 5, 3, 6, 7], 3));
    // [3, 3, 5, 5, 6, 7]
}`,
  },
};
