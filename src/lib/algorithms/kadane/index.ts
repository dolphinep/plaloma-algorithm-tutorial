import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface KadaneState {
  array: number[];
  index: number | null;
  currentStart: number;
  currentEnd: number;
  currentSum: number;
  bestStart: number;
  bestEnd: number;
  bestSum: number;
}

type KadaneInput = { array: number[] };

function generateSteps(input: KadaneInput): AlgorithmStep<KadaneState>[] {
  const { array } = input;
  const n = array.length;
  const steps: AlgorithmStep<KadaneState>[] = [];

  let currentStart = 0;
  let currentEnd = -1;
  let currentSum = 0;
  let bestStart = 0;
  let bestEnd = 0;
  let bestSum = -Infinity;

  // Init step
  steps.push({
    description: `Initialize. bestSum = -∞.`,
    state: {
      array: [...array],
      index: null,
      currentStart,
      currentEnd,
      currentSum,
      bestStart,
      bestEnd,
      bestSum,
    },
    highlights: {},
    variables: { currentSum, bestSum: "-∞" },
  });

  for (let i = 0; i < n; i++) {
    if (currentSum + array[i] > array[i]) {
      // Extend current subarray
      currentEnd = i;
      currentSum += array[i];
      steps.push({
        description: `Extend subarray: sum = ${currentSum}. Current window [${currentStart}..${currentEnd}].`,
        state: {
          array: [...array],
          index: i,
          currentStart,
          currentEnd,
          currentSum,
          bestStart,
          bestEnd,
          bestSum,
        },
        highlights: {
          [`array_${i}`]: "active",
        },
        variables: {
          i,
          "array[i]": array[i],
          currentSum,
          currentStart,
          currentEnd,
        },
      });
    } else {
      // Start fresh from i
      currentStart = i;
      currentEnd = i;
      currentSum = array[i];
      steps.push({
        description: `Start new subarray at index ${i} = ${array[i]}. Previous sum wasn't worth keeping.`,
        state: {
          array: [...array],
          index: i,
          currentStart,
          currentEnd,
          currentSum,
          bestStart,
          bestEnd,
          bestSum,
        },
        highlights: {
          [`array_${i}`]: "compare",
        },
        variables: {
          i,
          "array[i]": array[i],
          currentSum,
          currentStart,
        },
      });
    }

    if (currentSum > bestSum) {
      bestStart = currentStart;
      bestEnd = currentEnd;
      bestSum = currentSum;
      steps.push({
        description: `New best! [${bestStart}..${bestEnd}] = ${bestSum}.`,
        state: {
          array: [...array],
          index: i,
          currentStart,
          currentEnd,
          currentSum,
          bestStart,
          bestEnd,
          bestSum,
        },
        highlights: Object.fromEntries(
          Array.from({ length: bestEnd - bestStart + 1 }, (_, k) => [
            `array_${bestStart + k}`,
            "found" as const,
          ])
        ),
        variables: {
          bestStart,
          bestEnd,
          bestSum,
        },
      });
    }
  }

  // Final step
  steps.push({
    description: `Maximum subarray is [${bestStart}..${bestEnd}] with sum ${bestSum}.`,
    state: {
      array: [...array],
      index: null,
      currentStart,
      currentEnd,
      currentSum,
      bestStart,
      bestEnd,
      bestSum,
    },
    highlights: Object.fromEntries(
      Array.from({ length: bestEnd - bestStart + 1 }, (_, k) => [
        `array_${bestStart + k}`,
        "sorted" as const,
      ])
    ),
    variables: {
      bestStart,
      bestEnd,
      bestSum,
    },
  });

  return steps;
}

export const kadane: AlgorithmDefinition<KadaneInput, KadaneState> = {
  slug: "kadane",
  name: "Kadane's Algorithm",
  category: "dynamic-programming",
  difficulty: "beginner",
  tags: ["dp", "subarray", "maximum-sum", "greedy", "sliding-window"],
  summary:
    "Find the contiguous subarray with the largest sum in O(n) by tracking the best running total and resetting whenever the current sum falls below the next element alone.",

  description: `Kadane's Algorithm solves the **maximum subarray problem** in a single linear pass, making it one of the most elegant examples of dynamic programming at its simplest. The key insight is a local decision made at every index: is it better to extend the current running subarray, or to abandon it and restart fresh from the current element? If the accumulated sum so far is negative, it can only hurt the future total — so we discard it. This greedy choice is provably optimal, and no information about future elements is ever needed.

The algorithm maintains two invariants across the scan. The first is the **current subarray**: the best contiguous run ending exactly at the current index. The second is the **global best**: the best current subarray seen anywhere in the array so far. At every step the current subarray is updated first, then the global best is updated if the current surpasses it. Because both updates are O(1), the overall complexity is O(n) time and O(1) space — a significant improvement over the O(n²) brute-force approach of checking all pairs of start and end indices.

Kadane's Algorithm handles arrays with mixed positive and negative numbers naturally. The only edge case is an all-negative array, where the maximum subarray is the single least-negative element; the formulation used here — initializing bestSum to -∞ — handles this correctly by always keeping at least one element. Variants of the algorithm can also track start and end indices (as this implementation does), return the actual subarray, handle circular arrays, or be extended to 2D for maximum-sum submatrix problems.`,

  realWorldUsage: [
    {
      system: "Algorithmic trading platforms",
      useCase: "Maximum profit window detection in stock price time series",
      why: "Financial systems model daily price changes as a signed array (positive = gain, negative = loss). Kadane's Algorithm finds the optimal contiguous buy-hold-sell window in O(n), enabling real-time scanning of thousands of tickers without the O(n²) cost of checking every entry/exit pair.",
    },
    {
      system: "Signal processing pipelines (audio/radio)",
      useCase: "Maximum energy segment detection in sampled waveforms",
      why: "In radar, sonar, and audio analysis, engineers search for the contiguous time window with the highest signal-to-noise energy. Representing samples as signed amplitudes and applying Kadane's Algorithm identifies burst-energy segments in real time, replacing expensive sliding-window convolutions.",
    },
    {
      system: "Computer vision / image processing",
      useCase: "Maximum brightness region in a 1D pixel row or histogram",
      why: "The 2D variant of Kadane's Algorithm (applied column-by-column after compressing rows) is the standard approach for finding the maximum-sum submatrix in a grayscale image. This powers region-of-interest detection, blob analysis, and exposure-correction heatmaps in OpenCV pipelines.",
    },
  ],

  complexity: {
    time: { best: "O(n)", average: "O(n)", worst: "O(n)" },
    space: "O(1)",
  },

  related: ["fibonacci-dp", "coin-change"],
  implemented: true,
  defaultInput: { array: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
  generateSteps,

  code: {
    typescript: `function kadane(array: number[]): { sum: number; start: number; end: number } {
  let currentSum = 0;
  let currentStart = 0;
  let bestSum = -Infinity;
  let bestStart = 0;
  let bestEnd = 0;

  for (let i = 0; i < array.length; i++) {
    if (currentSum + array[i] > array[i]) {
      currentSum += array[i];
    } else {
      currentStart = i;
      currentSum = array[i];
    }

    if (currentSum > bestSum) {
      bestSum = currentSum;
      bestStart = currentStart;
      bestEnd = i;
    }
  }

  return { sum: bestSum, start: bestStart, end: bestEnd };
}

const arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
const result = kadane(arr);
console.log(result); // { sum: 6, start: 3, end: 6 }
console.log(arr.slice(result.start, result.end + 1)); // [4, -1, 2, 1]`,

    go: `package main

import (
	"fmt"
	"math"
)

type Result struct {
	Sum   int
	Start int
	End   int
}

func kadane(array []int) Result {
	currentSum := 0
	currentStart := 0
	bestSum := math.MinInt64
	bestStart, bestEnd := 0, 0

	for i, v := range array {
		if currentSum+v > v {
			currentSum += v
		} else {
			currentStart = i
			currentSum = v
		}

		if currentSum > bestSum {
			bestSum = currentSum
			bestStart = currentStart
			bestEnd = i
		}
	}

	return Result{Sum: bestSum, Start: bestStart, End: bestEnd}
}

func main() {
	arr := []int{-2, 1, -3, 4, -1, 2, 1, -5, 4}
	r := kadane(arr)
	fmt.Printf("sum=%d, window=%v\\n", r.Sum, arr[r.Start:r.End+1])
	// sum=6, window=[4 -1 2 1]
}`,

    rust: `fn kadane(array: &[i64]) -> (i64, usize, usize) {
    let mut current_sum: i64 = 0;
    let mut current_start: usize = 0;
    let mut best_sum = i64::MIN;
    let mut best_start = 0usize;
    let mut best_end = 0usize;

    for (i, &v) in array.iter().enumerate() {
        if current_sum + v > v {
            current_sum += v;
        } else {
            current_start = i;
            current_sum = v;
        }

        if current_sum > best_sum {
            best_sum = current_sum;
            best_start = current_start;
            best_end = i;
        }
    }

    (best_sum, best_start, best_end)
}

fn main() {
    let arr = [-2i64, 1, -3, 4, -1, 2, 1, -5, 4];
    let (sum, start, end) = kadane(&arr);
    println!("sum={}, window={:?}", sum, &arr[start..=end]);
    // sum=6, window=[4, -1, 2, 1]
}`,
  },
};
