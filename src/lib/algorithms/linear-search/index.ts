import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface LinearSearchState {
  array: number[];
  target: number;
  current: number | null;
  found: number | null;
}

type LinearSearchInput = { array: number[]; target: number };

function generateSteps(
  input: LinearSearchInput
): AlgorithmStep<LinearSearchState>[] {
  const { array, target } = input;
  const steps: AlgorithmStep<LinearSearchState>[] = [];
  const n = array.length;

  // Initial step
  steps.push({
    description: `Start linear search for ${target} in array of ${n} elements.`,
    state: { array: [...array], target, current: null, found: null },
    highlights: {},
    variables: { target, n },
  });

  let foundIndex: number | null = null;

  for (let i = 0; i < n; i++) {
    const isMatch = array[i] === target;

    steps.push({
      description: `Check array[${i}] = ${array[i]}. ${
        isMatch ? "Match found!" : "Not a match. Continue."
      }`,
      state: {
        array: [...array],
        target,
        current: i,
        found: isMatch ? i : null,
      },
      highlights: {
        [`element_${i}`]: isMatch ? "found" : "active",
      },
      variables: {
        index: i,
        value: array[i],
        comparisons: i + 1,
        match: isMatch,
      },
    });

    if (isMatch) {
      foundIndex = i;
      break;
    }
  }

  // Final step
  if (foundIndex !== null) {
    steps.push({
      description: `Found ${target} at index ${foundIndex}. Total comparisons: ${foundIndex + 1}.`,
      state: {
        array: [...array],
        target,
        current: foundIndex,
        found: foundIndex,
      },
      highlights: { [`element_${foundIndex}`]: "found" },
      variables: { result: foundIndex, comparisons: foundIndex + 1 },
    });
  } else {
    steps.push({
      description: `${target} not found. Scanned all ${n} elements.`,
      state: { array: [...array], target, current: null, found: null },
      highlights: {},
      variables: { result: -1, comparisons: n },
    });
  }

  return steps;
}

export const linearSearch: AlgorithmDefinition<
  LinearSearchInput,
  LinearSearchState
> = {
  slug: "linear-search",
  name: "Linear Search",
  category: "searching",
  difficulty: "beginner",
  tags: ["search", "unsorted", "sequential", "comparison"],
  summary:
    "Scan every element in sequence until the target is found or the array is exhausted.",

  description: `Linear Search is the most fundamental search algorithm: it inspects each element of the collection one at a time, from first to last, until it either finds the target value or confirms it is absent. Because no structural assumptions are made about the data, it works on any sequence — sorted, unsorted, or partially ordered — without any preprocessing step.

The algorithm's O(1) best case occurs when the target is the very first element. On average it scans n/2 elements, and in the worst case (target absent or at the end) it examines all n elements. Despite its O(n) average complexity, linear search is often the fastest choice for small arrays (typically fewer than 8–16 elements) because modern CPUs prefetch contiguous memory extremely efficiently, and binary search's branching overhead and cache miss cost can dominate on short sequences.

Linear Search also handles duplicate values naturally — it can return the first, last, or all occurrences simply by adjusting termination conditions. Its extreme simplicity makes it a common choice in situations where correctness and readability outweigh raw throughput, such as ad-hoc scripts, test helpers, or searching through configuration lists read once at startup.`,

  realWorldUsage: [
    {
      system: "Database query engine (table scan)",
      useCase: "Finding rows in an unindexed column",
      why: "When a query filter targets a column with no index, the database has no choice but to perform a full sequential scan. For small tables or one-off analytical queries, the overhead of building an index exceeds the cost of a single linear scan, so databases deliberately fall back to this strategy.",
    },
    {
      system: "JavaScript runtime / V8",
      useCase: "Array.prototype.find and indexOf on short arrays",
      why: "V8 uses linear search internally for small typed arrays (length < 8) because the binary search branch penalty and bounds-check overhead cost more cycles than the sequential scan on data that fits entirely in a cache line.",
    },
    {
      system: "Network packet inspection",
      useCase: "Scanning ACL rule lists in small firewall configurations",
      why: "Firewall ACLs are typically evaluated in order (first-match wins). For deployments with fewer than a dozen rules, linear scan is simpler to reason about than tree or hash structures, and its sequential memory access pattern makes it near-optimal on modern hardware.",
    },
  ],

  complexity: {
    time: { best: "O(1)", average: "O(n)", worst: "O(n)" },
    space: "O(1)",
    inPlace: true,
  },

  related: ["binary-search", "jump-search"],
  implemented: true,
  defaultInput: { array: [14, 3, 27, 9, 45, 6, 31, 18], target: 45 },
  generateSteps,

  code: {
    typescript: `function linearSearch(arr: number[], target: number): number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1; // not found
}

// Usage
const data = [14, 3, 27, 9, 45, 6, 31, 18];
console.log(linearSearch(data, 45)); // 4
console.log(linearSearch(data, 99)); // -1`,

    go: `package main

import "fmt"

func linearSearch(arr []int, target int) int {
	for i, v := range arr {
		if v == target {
			return i
		}
	}
	return -1 // not found
}

func main() {
	data := []int{14, 3, 27, 9, 45, 6, 31, 18}
	fmt.Println(linearSearch(data, 45)) // 4
	fmt.Println(linearSearch(data, 99)) // -1
}`,

    rust: `fn linear_search(arr: &[i32], target: i32) -> Option<usize> {
    arr.iter().position(|&val| val == target)
}

fn main() {
    let data = [14, 3, 27, 9, 45, 6, 31, 18];
    println!("{:?}", linear_search(&data, 45)); // Some(4)
    println!("{:?}", linear_search(&data, 99)); // None
}`,
  },
};
