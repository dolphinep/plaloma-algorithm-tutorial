import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface BinarySearchState {
  array: number[];
  target: number;
  left: number;
  right: number;
  mid: number | null;
  found: number | null;
}

function generateSteps(input: { array: number[]; target: number }): AlgorithmStep<BinarySearchState>[] {
  const { array, target } = input;
  const sorted = [...array].sort((a, b) => a - b);
  const steps: AlgorithmStep<BinarySearchState>[] = [];

  let left = 0;
  let right = sorted.length - 1;

  steps.push({
    description: `Start: searching for ${target} in [${sorted.join(", ")}]. Set left=0, right=${sorted.length - 1}.`,
    state: { array: sorted, target, left, right, mid: null, found: null },
    highlights: {},
    variables: { left, right },
  });

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    steps.push({
      description: `Calculate mid = ⌊(${left} + ${right}) / 2⌋ = ${mid}. Check array[${mid}] = ${sorted[mid]}.`,
      state: { array: sorted, target, left, right, mid, found: null },
      highlights: {
        [left]: "active",
        [right]: "active",
        [mid]: "compare",
      },
      variables: { left, right, mid, "array[mid]": sorted[mid] },
    });

    if (sorted[mid] === target) {
      steps.push({
        description: `Found! array[${mid}] = ${sorted[mid]} equals target ${target}. Return index ${mid}.`,
        state: { array: sorted, target, left, right, mid, found: mid },
        highlights: { [mid]: "found" },
        variables: { left, right, mid, result: mid },
      });
      return steps;
    } else if (sorted[mid] < target) {
      steps.push({
        description: `array[${mid}] = ${sorted[mid]} < ${target}. Target is in right half. Move left = mid + 1 = ${mid + 1}.`,
        state: { array: sorted, target, left: mid + 1, right, mid, found: null },
        highlights: { [mid]: "sorted" },
        variables: { left: mid + 1, right, mid },
      });
      left = mid + 1;
    } else {
      steps.push({
        description: `array[${mid}] = ${sorted[mid]} > ${target}. Target is in left half. Move right = mid - 1 = ${mid - 1}.`,
        state: { array: sorted, target, left, right: mid - 1, mid, found: null },
        highlights: { [mid]: "sorted" },
        variables: { left, right: mid - 1, mid },
      });
      right = mid - 1;
    }
  }

  steps.push({
    description: `left (${left}) > right (${right}). Search space exhausted. ${target} not found. Return -1.`,
    state: { array: sorted, target, left, right, mid: null, found: null },
    highlights: {},
    variables: { left, right, result: -1 },
  });

  return steps;
}

export const binarySearch: AlgorithmDefinition<{ array: number[]; target: number }, BinarySearchState> = {
  slug: "binary-search",
  name: "Binary Search",
  category: "searching",
  difficulty: "beginner",
  tags: ["search", "divide-and-conquer", "sorted", "logarithmic"],
  summary: "Efficiently find an element in a sorted array by halving the search space each iteration.",
  description: `Binary Search works on the **divide and conquer** principle. Given a sorted array, it repeatedly divides the search interval in half. If the target value is less than the middle element, it narrows to the lower half; if greater, to the upper half. This continues until the element is found or the interval is empty.

The key requirement is that the input must be **sorted**. In exchange, you get O(log n) search time — searching 1 billion elements takes at most 30 comparisons.`,
  realWorldUsage: [
    {
      system: "PostgreSQL / B-tree index",
      useCase: "Index range scans",
      why: "PostgreSQL's B-tree indexes use a binary-search-like traversal to locate index entries in O(log n). When you run WHERE id = 42 on an indexed column, the planner descends the B-tree using binary comparisons at each node.",
    },
    {
      system: "Linux kernel",
      useCase: "Searching sorted kernel tables",
      why: "The kernel uses binary search (bsearch()) in hot paths like looking up system call tables, IRQ descriptors, and exception tables — all of which are sorted at compile time.",
    },
    {
      system: "Git",
      useCase: "git bisect",
      why: "git bisect is literally binary search over commit history to find which commit introduced a bug. It halves the suspect range on each good/bad verdict.",
    },
    {
      system: "Standard Libraries",
      useCase: "sort.Search (Go), std::lower_bound (C++), Array.prototype (JS)",
      why: "All major standard libraries ship a binary search implementation because it's the canonical O(log n) lookup over sorted collections.",
    },
  ],
  complexity: {
    time: { best: "O(1)", average: "O(log n)", worst: "O(log n)" },
    space: "O(1)",
    stable: true,
    inPlace: true,
  },
  related: ["linear-search", "jump-search", "interpolation-search", "quick-sort"],
  implemented: true,
  defaultInput: { array: [3, 7, 1, 9, 4, 6, 14, 2, 11, 8], target: 7 },
  generateSteps,
  code: {
    typescript: `function binarySearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1; // not found
}

// Usage
const sorted = [1, 3, 5, 7, 9, 11, 13];
console.log(binarySearch(sorted, 7));  // 3
console.log(binarySearch(sorted, 6));  // -1`,

    go: `package main

import "fmt"

func binarySearch(arr []int, target int) int {
	left, right := 0, len(arr)-1

	for left <= right {
		mid := left + (right-left)/2 // avoids overflow vs (left+right)/2

		switch {
		case arr[mid] == target:
			return mid
		case arr[mid] < target:
			left = mid + 1
		default:
			right = mid - 1
		}
	}

	return -1 // not found
}

func main() {
	sorted := []int{1, 3, 5, 7, 9, 11, 13}
	fmt.Println(binarySearch(sorted, 7))  // 3
	fmt.Println(binarySearch(sorted, 6))  // -1
}`,

    rust: `fn binary_search(arr: &[i32], target: i32) -> Option<usize> {
    let mut left = 0;
    let mut right = arr.len();

    while left < right {
        let mid = left + (right - left) / 2; // no overflow

        match arr[mid].cmp(&target) {
            std::cmp::Ordering::Equal => return Some(mid),
            std::cmp::Ordering::Less => left = mid + 1,
            std::cmp::Ordering::Greater => right = mid,
        }
    }

    None // not found
}

fn main() {
    let sorted = [1, 3, 5, 7, 9, 11, 13];
    println!("{:?}", binary_search(&sorted, 7));  // Some(3)
    println!("{:?}", binary_search(&sorted, 6));  // None
}`,
  },
};
