import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ── Local state type ─────────────────────────────────────────────────────────
interface LISState {
  array: number[];
  index: number | null;
  dp: number[];
  tails: number[];
  best: number[];
  result: number | null;
  phase: "filling" | "done";
}

// ── Input ────────────────────────────────────────────────────────────────────
interface LISInput {
  array: number[];
}

const DEFAULT_LIS_INPUT: LISInput = {
  array: [10, 9, 2, 5, 3, 7, 101, 18],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Binary search: first index in `tails` where tails[pos] >= value (lower_bound). */
function lowerBound(tails: number[], value: number): number {
  let lo = 0;
  let hi = tails.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (tails[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// ── Step generator ───────────────────────────────────────────────────────────
function generateSteps(input: LISInput): AlgorithmStep<LISState>[] {
  const { array } = input;
  const n = array.length;
  const steps: AlgorithmStep<LISState>[] = [];

  // O(n²) dp array for display clarity
  const dp: number[] = Array(n).fill(1);
  // O(n log n) patience-sorting tails
  const tails: number[] = [];
  // best indices — updated heuristically (leftmost indices forming LIS)
  const best: number[] = [];

  const snap = (
    description: string,
    index: number | null,
    result: number | null,
    phase: "filling" | "done",
    extra?: Record<string, string | number>
  ): AlgorithmStep<LISState> => ({
    description,
    state: {
      array,
      index,
      dp: [...dp],
      tails: [...tails],
      best: [...best],
      result,
      phase,
    },
    highlights: index !== null ? { [index]: "active" } : {},
    variables: {
      tailsLength: tails.length,
      ...(index !== null ? { "array[i]": array[index] } : {}),
      ...extra,
    },
  });

  // Initial step
  steps.push(
    snap(
      "Find Longest Increasing Subsequence using patience sorting (O(n log n)) for tails, plus O(n²) dp for per-element LIS lengths.",
      null,
      null,
      "filling"
    )
  );

  for (let i = 0; i < n; i++) {
    const v = array[i];

    // ── O(n log n): binary search for position in tails ──────────────────────
    const pos = lowerBound(tails, v);
    const oldTail = tails[pos]; // may be undefined if extending

    if (pos === tails.length) {
      tails.push(v);
      // Update best: append i (we just extended the LIS)
      best.push(i);
      steps.push(
        snap(
          `array[${i}]=${v}: larger than all tails — extends LIS. tails = [${tails.join(",")}]. LIS length so far = ${tails.length}.`,
          i,
          null,
          "filling",
          { pos, action: "extend" }
        )
      );
    } else {
      tails[pos] = v;
      // Update best: replace corresponding position
      if (pos < best.length) best[pos] = i;
      else best.push(i);
      steps.push(
        snap(
          `array[${i}]=${v}: replaces tails[${pos}]=${oldTail} → ${v}. tails = [${tails.join(",")}].`,
          i,
          null,
          "filling",
          { pos, replacedValue: oldTail, newValue: v }
        )
      );
    }

    // ── O(n²): compute dp[i] = longest IS ending exactly at i ─────────────────
    for (let j = 0; j < i; j++) {
      if (array[j] < v) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }

  const result = tails.length;

  steps.push(
    snap(
      `LIS length = ${result}. Tails (patience piles): [${tails.join(",")}]. dp = [${dp.join(",")}].`,
      null,
      result,
      "done",
      { lisLength: result }
    )
  );

  return steps;
}

// ── Export ───────────────────────────────────────────────────────────────────
export const lis: AlgorithmDefinition<LISInput, LISState> = {
  slug: "lis",
  name: "Longest Increasing Subsequence",
  category: "dynamic-programming",
  difficulty: "intermediate",
  tags: ["subsequence", "patience-sorting", "binary-search"],
  summary:
    "Find the length of the longest strictly increasing subsequence using patience sorting in O(n log n).",

  description: `Longest Increasing Subsequence (LIS) finds the length of the longest subsequence of a given array in which all elements are in strictly increasing order. Unlike substrings or subarrays, subsequence elements need not be contiguous — they only need to preserve relative order.

The O(n²) DP approach tracks dp[i] = the length of the longest IS ending at index i, but patience sorting achieves O(n log n) by maintaining an auxiliary tails array where tails[k] holds the smallest tail element of all IS of length k+1 seen so far. For each new element a binary search locates where to place or replace in tails, keeping the array sorted and compact.

**Why tails stays sorted:** every replacement preserves the property that tails[i] < tails[i+1], because we only replace tails[pos] with a value strictly smaller than tails[pos+1] (by the lower_bound invariant).

The length of tails at the end equals the LIS length. While tails itself is not necessarily a valid subsequence, it encodes the patience-sort pile structure used in card game analysis and can be extended with parent-pointer tracking to reconstruct an actual subsequence.`,

  realWorldUsage: [
    {
      system: "Version control diff algorithms",
      useCase:
        "Computing minimal edit scripts between file revisions",
      why: "Hunt-Szymanski and similar diff algorithms reduce the diff problem to an LIS problem on a list of matching line pairs. Finding the LIS of these matches yields the largest common subsequence, which directly maps to the minimal set of insertions and deletions in the diff output.",
    },
    {
      system: "Stock price analysis",
      useCase:
        "Finding the longest run of non-decreasing closing prices",
      why: "Quant analysts use LIS variants to identify momentum streaks and trend-following signals in price series without requiring contiguous windows, making it robust to temporary pullbacks that would break a sliding-window approach.",
    },
    {
      system: "Scheduling theory (Dilworth's theorem)",
      useCase:
        "Decomposing a partial order into the minimum number of chains",
      why: "By Dilworth's theorem, the minimum number of decreasing subsequences needed to partition a sequence equals the length of the longest increasing subsequence. Job schedulers use this to compute the minimum number of parallel execution lanes required for a dependency-ordered task graph.",
    },
  ],

  complexity: {
    time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
    space: "O(n)",
  },

  related: ["lcs", "knapsack"],
  implemented: true,
  defaultInput: DEFAULT_LIS_INPUT,
  generateSteps,

  code: {
    typescript: `function lisLength(arr: number[]): number {
  const tails: number[] = [];

  for (const v of arr) {
    // Binary search: first index where tails[pos] >= v
    let lo = 0, hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] < v) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = v; // extend or replace
  }

  return tails.length; // LIS length
}

// Usage
console.log(lisLength([10, 9, 2, 5, 3, 7, 101, 18])); // 4
console.log(lisLength([0, 1, 0, 3, 2, 3]));            // 4`,

    go: `package main

import "fmt"

func lisLength(arr []int) int {
	tails := []int{}

	for _, v := range arr {
		// lower_bound: first pos where tails[pos] >= v
		lo, hi := 0, len(tails)
		for lo < hi {
			mid := (lo + hi) / 2
			if tails[mid] < v {
				lo = mid + 1
			} else {
				hi = mid
			}
		}
		if lo == len(tails) {
			tails = append(tails, v)
		} else {
			tails[lo] = v
		}
	}

	return len(tails)
}

func main() {
	fmt.Println(lisLength([]int{10, 9, 2, 5, 3, 7, 101, 18})) // 4
	fmt.Println(lisLength([]int{0, 1, 0, 3, 2, 3}))            // 4
}`,

    rust: `fn lis_length(arr: &[i32]) -> usize {
    let mut tails: Vec<i32> = Vec::new();

    for &v in arr {
        // lower_bound: first index where tails[pos] >= v
        let pos = tails.partition_point(|&t| t < v);
        if pos == tails.len() {
            tails.push(v);
        } else {
            tails[pos] = v;
        }
    }

    tails.len()
}

fn main() {
    println!("{}", lis_length(&[10, 9, 2, 5, 3, 7, 101, 18])); // 4
    println!("{}", lis_length(&[0, 1, 0, 3, 2, 3]));            // 4
}`,
  },
};
