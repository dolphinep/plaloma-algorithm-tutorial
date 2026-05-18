import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ── Local state type ─────────────────────────────────────────────────────────
interface TwoSumState {
  array: number[];
  target: number;
  hashMap: Record<number, number>; // value → index
  current: number | null;
  complement: number | null;
  foundIndices: [number, number] | null;
}

// ── Input ────────────────────────────────────────────────────────────────────
interface TwoSumInput {
  array: number[];
  target: number;
}

const DEFAULT_TWO_SUM_INPUT: TwoSumInput = {
  array: [2, 7, 11, 15, 1, 8, 3],
  target: 9,
};

// ── Step generator ───────────────────────────────────────────────────────────
function generateSteps(
  input: TwoSumInput
): AlgorithmStep<TwoSumState>[] {
  const { array, target } = input;
  const n = array.length;
  const steps: AlgorithmStep<TwoSumState>[] = [];

  // Working state
  const hashMap: Record<number, number> = {};
  let foundIndices: [number, number] | null = null;

  const snap = (
    description: string,
    current: number | null,
    complement: number | null,
    found: [number, number] | null
  ): AlgorithmStep<TwoSumState> => ({
    description,
    state: {
      array: [...array],
      target,
      hashMap: { ...hashMap },
      current,
      complement,
      foundIndices: found,
    },
    highlights: {},
    variables: found
      ? {
          index1: found[0],
          index2: found[1],
          sum: array[found[0]] + array[found[1]],
        }
      : {},
  });

  // Step 0: initialisation
  steps.push(
    snap(
      "Build a hash map to store seen values and their indices. We iterate once — O(n) time and space.",
      null,
      null,
      null
    )
  );

  for (let i = 0; i < n; i++) {
    const complement = target - array[i];
    const inMap = complement in hashMap;

    // Step: examine current element
    steps.push(
      snap(
        `Check array[${i}]=${array[i]}. Need complement=${complement}. Is ${complement} in map? ${inMap ? "YES!" : "No."}`,
        i,
        complement,
        null
      )
    );

    if (inMap) {
      // Found the pair
      foundIndices = [hashMap[complement], i];
      steps.push(
        snap(
          `Found! array[${hashMap[complement]}]+array[${i}] = ${array[hashMap[complement]]}+${array[i]} = ${target}. Indices: [${hashMap[complement]}, ${i}].`,
          i,
          complement,
          foundIndices
        )
      );
      break;
    } else {
      // Add current value to map
      hashMap[array[i]] = i;
      steps.push(
        snap(
          `Add ${array[i]}→${i} to map. Map now has ${Object.keys(hashMap).length} entr${Object.keys(hashMap).length === 1 ? "y" : "ies"}.`,
          i,
          complement,
          null
        )
      );
    }
  }

  // If no pair was found
  if (!foundIndices) {
    steps.push(
      snap(
        `No two numbers in the array sum to ${target}.`,
        null,
        null,
        null
      )
    );
  }

  return steps;
}

// ── Export ───────────────────────────────────────────────────────────────────
export const twoSum: AlgorithmDefinition<TwoSumInput, TwoSumState> = {
  slug: "two-sum",
  name: "Two Sum",
  category: "searching",
  difficulty: "beginner",
  tags: ["hash-map", "array", "complement", "single-pass"],
  summary:
    "Find two indices in an array whose values sum to a target using a single-pass hash map.",

  description: `Two Sum finds two indices i and j (i ≠ j) such that array[i] + array[j] === target.

The naive approach checks every pair in O(n²) time. The optimal solution uses a hash map to achieve O(n) time with a single pass:

For each element array[i], compute its **complement** = target − array[i]. If the complement is already in the map, a valid pair has been found — return the stored index and i. Otherwise, store array[i] → i in the map for future lookups.

**Why this works:** by the time we reach array[j], if array[i] = target − array[j] was seen earlier (i < j), it is guaranteed to be in the map. We never need to look back.

**Key insight:** instead of asking "does any earlier value pair with the current one?", we transform the search into a O(1) hash map lookup by pre-computing what we *need* at each step.

This pattern — store what you've seen, look up what you need — generalises to many array and streaming problems.`,

  realWorldUsage: [
    {
      system: "Financial systems — transaction pair matching",
      useCase: "Detecting debit/credit pairs that net to a specific amount",
      why: "Reconciliation engines scan ledgers for offsetting transactions (e.g. a charge and its corresponding refund). Hashing transaction amounts allows O(1) lookup per record, reducing nightly batch reconciliation from hours to minutes on millions of rows.",
    },
    {
      system: "Data pipelines — duplicate and collision detection",
      useCase: "Finding elements that sum to a sentinel value indicating corruption",
      why: "ETL pipelines use complement-based checks to detect symmetric encoding errors or intentional watermarks. A single-pass hash-map scan scales to streaming ingestion without buffering the full dataset.",
    },
    {
      system: "Streaming systems — real-time complement lookups",
      useCase: "Matching bid/ask orders in exchange matching engines",
      why: "Order-book engines must continuously check whether an incoming order can be matched against a resting order at a price that sums to (or exceeds) a synthetic benchmark. Hash-map indexing gives sub-microsecond lookup at exchange-grade throughput.",
    },
  ],

  complexity: {
    time: { best: "O(n)", average: "O(n)", worst: "O(n)" },
    space: "O(n)",
  },

  related: ["binary-search", "hash-table"],
  implemented: true,
  defaultInput: DEFAULT_TWO_SUM_INPUT,
  generateSteps,

  code: {
    typescript: `function twoSum(array: number[], target: number): [number, number] | null {
  const map = new Map<number, number>(); // value → index

  for (let i = 0; i < array.length; i++) {
    const complement = target - array[i];

    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }

    map.set(array[i], i);
  }

  return null; // no pair found
}

// Usage
console.log(twoSum([2, 7, 11, 15, 1, 8, 3], 9)); // [0, 1]`,

    go: `package main

import "fmt"

func twoSum(nums []int, target int) (int, int, bool) {
	seen := make(map[int]int) // value → index

	for i, v := range nums {
		complement := target - v
		if j, ok := seen[complement]; ok {
			return j, i, true
		}
		seen[v] = i
	}

	return 0, 0, false
}

func main() {
	i, j, ok := twoSum([]int{2, 7, 11, 15, 1, 8, 3}, 9)
	if ok {
		fmt.Printf("[%d, %d]\\n", i, j) // [0, 1]
	}
}`,

    rust: `use std::collections::HashMap;

fn two_sum(nums: &[i32], target: i32) -> Option<(usize, usize)> {
    let mut seen: HashMap<i32, usize> = HashMap::new();

    for (i, &v) in nums.iter().enumerate() {
        let complement = target - v;
        if let Some(&j) = seen.get(&complement) {
            return Some((j, i));
        }
        seen.insert(v, i);
    }

    None
}

fn main() {
    let nums = [2, 7, 11, 15, 1, 8, 3];
    if let Some((i, j)) = two_sum(&nums, 9) {
        println!("[{}, {}]", i, j); // [0, 1]
    }
}`,
  },
};
