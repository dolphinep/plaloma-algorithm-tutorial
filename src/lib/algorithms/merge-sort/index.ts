import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";
import {
  DEFAULT_SORT_INPUT,
  SortingInput,
  SortingState,
  BarState,
  snap,
  allSorted,
} from "../sorting-utils";

function generateSteps(
  input: SortingInput
): AlgorithmStep<SortingState>[] {
  const arr = [...input.array];
  const n = arr.length;
  const steps: AlgorithmStep<SortingState>[] = [];
  let comparisons = 0;
  let swaps = 0;

  const initial: BarState[] = Array(n).fill("default");
  steps.push(
    snap(arr, initial, comparisons, swaps, "Starting Merge Sort (bottom-up). All elements are unsorted.")
  );

  // Bottom-up iterative merge sort
  for (let width = 1; width < n; width *= 2) {
    const isFinalPass = width * 2 >= n;

    for (let left = 0; left < n; left += 2 * width) {
      const mid = Math.min(left + width - 1, n - 1);
      const right = Math.min(left + 2 * width - 1, n - 1);

      if (mid >= right) continue; // nothing to merge

      // Step 1: mark the two subarrays being merged
      const mergeStart: BarState[] = Array(n).fill("default");
      // preserve already-sorted elements from previous passes
      if (isFinalPass) {
        // will mark sorted after, not before
      }
      for (let k = left; k <= right; k++) mergeStart[k] = "range";
      for (let k = left; k <= mid; k++) mergeStart[k] = "left";
      for (let k = mid + 1; k <= right; k++) mergeStart[k] = "right";

      steps.push(
        snap(
          arr,
          mergeStart,
          comparisons,
          swaps,
          `Merging subarrays [${left}..${mid}] and [${mid + 1}..${right}].`,
          undefined,
          { width, left, mid, right }
        )
      );

      // Two-pointer merge into temp
      const temp: number[] = [];
      let i = left;
      let j = mid + 1;

      while (i <= mid && j <= right) {
        const comparing: BarState[] = Array(n).fill("default");
        for (let k = left; k <= right; k++) comparing[k] = "range";
        comparing[i] = "comparing";
        comparing[j] = "comparing";
        comparisons++;

        const smaller = arr[i] <= arr[j] ? arr[i] : arr[j];
        steps.push(
          snap(
            arr,
            comparing,
            comparisons,
            swaps,
            `Compare ${arr[i]} vs ${arr[j]}, take ${smaller}.`,
            undefined,
            { i, j, "arr[i]": arr[i], "arr[j]": arr[j] }
          )
        );

        if (arr[i] <= arr[j]) {
          temp.push(arr[i]);
          i++;
        } else {
          temp.push(arr[j]);
          j++;
        }
      }

      while (i <= mid) { temp.push(arr[i]); i++; }
      while (j <= right) { temp.push(arr[j]); j++; }

      // Copy temp back into arr
      for (let k = 0; k < temp.length; k++) {
        arr[left + k] = temp[k];
        swaps++;
      }

      // Step after merge: mark as sorted only on the final pass, otherwise default
      const afterMerge: BarState[] = Array(n).fill("default");
      if (isFinalPass) {
        for (let k = left; k <= right; k++) afterMerge[k] = "sorted";
      } else {
        for (let k = left; k <= right; k++) afterMerge[k] = "default";
      }

      steps.push(
        snap(
          arr,
          afterMerge,
          comparisons,
          swaps,
          isFinalPass
            ? `Merged [${left}..${right}] into final sorted order.`
            : `Merged [${left}..${right}] — subarray is locally sorted.`,
          undefined,
          { width, left, right }
        )
      );
    }
  }

  steps.push(
    snap(arr, allSorted(n), comparisons, swaps, "Array is fully sorted.")
  );

  return steps;
}

export const mergeSort: AlgorithmDefinition<SortingInput, SortingState> = {
  slug: "merge-sort",
  name: "Merge Sort",
  category: "sorting",
  difficulty: "intermediate",
  tags: ["comparison", "stable", "divide-and-conquer"],
  summary: "Divide the array into halves, sort each half, then merge them back together in sorted order.",

  description: `Merge Sort is a divide-and-conquer algorithm that recursively splits the input in half, sorts each half, and then merges the two sorted halves into a single sorted sequence. This bottom-up iterative variant achieves the same result without recursion: it starts by treating every single element as a sorted subarray of length 1, then repeatedly merges adjacent pairs — doubling the subarray length each pass — until the entire array is sorted.

The merge step is the heart of the algorithm. Two sorted subarrays are combined by repeatedly comparing their leading elements and placing the smaller one into the output buffer. After the merge, the buffer is copied back. This approach guarantees O(n log n) comparisons in all cases — best, average, and worst — because the depth of the merge tree is always log₂ n, and each level does O(n) work.

Merge Sort is **stable**: equal elements drawn from the left subarray are always placed before equal elements from the right, preserving their original relative order. The trade-off is the O(n) auxiliary space required for the temporary merge buffer. This predictable performance and stability make it the foundation of Timsort, which is used by Python, Java, and Node.js for general-purpose sorting.`,

  realWorldUsage: [
    {
      system: "Python / Java / Node.js — Timsort",
      useCase: "General-purpose stable sort for all built-in sort functions",
      why: "Timsort, the default sort in CPython, Java Arrays.sort (objects), and V8, is derived from merge sort. Its merge phase guarantees O(n log n) worst case and stability, making it safe for sorting complex objects by multiple keys without disturbing other fields.",
    },
    {
      system: "External sorting of database files",
      useCase: "Sorting datasets too large to fit in RAM",
      why: "External merge sort reads chunks of data from disk, sorts each chunk in memory, writes sorted runs back to disk, then repeatedly merges runs. Because merging only requires reading two streams sequentially, it minimises random-access I/O — critical when data lives on spinning disk or object storage.",
    },
    {
      system: "GNU sort (coreutils)",
      useCase: "Sorting large text files on the command line",
      why: "GNU `sort` uses an external merge sort strategy: it splits input into chunks that fit in memory, sorts each with an in-memory algorithm, and then performs a k-way merge of the sorted temporary files. This allows it to sort files many times larger than available RAM with predictable performance.",
    },
  ],

  complexity: {
    time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
    space: "O(n)",
    stable: true,
    inPlace: false,
  },

  related: ["quick-sort", "heap-sort", "insertion-sort"],
  implemented: true,
  defaultInput: DEFAULT_SORT_INPUT,
  generateSteps,

  code: {
    typescript: `function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return result.concat(left.slice(i), right.slice(j));
}

// Usage
console.log(mergeSort([38, 27, 43, 3, 9, 82, 10, 55]));
// [3, 9, 10, 27, 38, 43, 55, 82]`,

    go: `package main

import "fmt"

func mergeSort(arr []int) []int {
	if len(arr) <= 1 {
		return arr
	}

	mid := len(arr) / 2
	left := mergeSort(arr[:mid])
	right := mergeSort(arr[mid:])

	return merge(left, right)
}

func merge(left, right []int) []int {
	result := make([]int, 0, len(left)+len(right))
	i, j := 0, 0

	for i < len(left) && j < len(right) {
		if left[i] <= right[j] {
			result = append(result, left[i])
			i++
		} else {
			result = append(result, right[j])
			j++
		}
	}

	result = append(result, left[i:]...)
	result = append(result, right[j:]...)
	return result
}

func main() {
	input := []int{38, 27, 43, 3, 9, 82, 10, 55}
	fmt.Println(mergeSort(input))
	// [3 9 10 27 38 43 55 82]
}`,

    rust: `fn merge_sort(arr: &[i32]) -> Vec<i32> {
    if arr.len() <= 1 {
        return arr.to_vec();
    }

    let mid = arr.len() / 2;
    let left = merge_sort(&arr[..mid]);
    let right = merge_sort(&arr[mid..]);

    merge(&left, &right)
}

fn merge(left: &[i32], right: &[i32]) -> Vec<i32> {
    let mut result = Vec::with_capacity(left.len() + right.len());
    let (mut i, mut j) = (0, 0);

    while i < left.len() && j < right.len() {
        if left[i] <= right[j] {
            result.push(left[i]);
            i += 1;
        } else {
            result.push(right[j]);
            j += 1;
        }
    }

    result.extend_from_slice(&left[i..]);
    result.extend_from_slice(&right[j..]);
    result
}

fn main() {
    let input = [38, 27, 43, 3, 9, 82, 10, 55];
    println!("{:?}", merge_sort(&input));
    // [3, 9, 10, 27, 38, 43, 55, 82]
}`,
  },
};
