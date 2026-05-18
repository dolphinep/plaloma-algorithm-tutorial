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

  // Initial snapshot — first element is trivially sorted
  const initial: BarState[] = Array(n).fill("default");
  initial[0] = "sorted";
  steps.push(
    snap(arr, initial, comparisons, swaps, "Starting Insertion Sort. arr[0] is trivially sorted.")
  );

  for (let i = 1; i < n; i++) {
    const key = arr[i];

    // Highlight the element being inserted
    const picking: BarState[] = Array(n).fill("default");
    for (let k = 0; k < i; k++) picking[k] = "sorted";
    picking[i] = "active";

    steps.push(
      snap(
        arr,
        picking,
        comparisons,
        swaps,
        `Pick arr[${i}]=${key} to insert into the sorted region [0..${i - 1}].`,
        undefined,
        { i, key }
      )
    );

    let j = i - 1;

    while (j >= 0 && arr[j] > key) {
      // Show the comparison
      const comparing: BarState[] = Array(n).fill("default");
      for (let k = 0; k < i; k++) comparing[k] = "sorted";
      comparing[j] = "comparing";
      comparing[j + 1] = "active";
      comparisons++;

      steps.push(
        snap(
          arr,
          comparing,
          comparisons,
          swaps,
          `arr[${j}]=${arr[j]} > ${key} — shift right to make room.`,
          undefined,
          { i, j, key, "arr[j]": arr[j] }
        )
      );

      // Shift element one position to the right
      arr[j + 1] = arr[j];
      swaps++;
      j--;
    }

    // Place the key in its correct position
    arr[j + 1] = key;

    const inserted: BarState[] = Array(n).fill("default");
    for (let k = 0; k <= i; k++) inserted[k] = "sorted";

    steps.push(
      snap(
        arr,
        inserted,
        comparisons,
        swaps,
        `Insert ${key} at position ${j + 1}. Sorted region is now [0..${i}].`,
        undefined,
        { i, insertedAt: j + 1, key }
      )
    );
  }

  // Final snapshot
  steps.push(
    snap(arr, allSorted(n), comparisons, swaps, "Array is fully sorted.")
  );

  return steps;
}

export const insertionSort: AlgorithmDefinition<SortingInput, SortingState> = {
  slug: "insertion-sort",
  name: "Insertion Sort",
  category: "sorting",
  difficulty: "beginner",
  tags: ["comparison", "stable", "in-place", "online"],
  summary: "Build a sorted array one element at a time by inserting each new element into its correct position.",

  description: `Insertion Sort builds the final sorted array one element at a time. It starts with the first element (trivially sorted) and iterates through the rest of the array. For each new element it scans left through the sorted region, shifting elements one position right until it finds the correct insertion point, then places the element there.

The algorithm mirrors how most people sort a hand of playing cards: you pick up a new card and slide it left past cards that are larger until it is in the right spot. This mental model makes Insertion Sort easy to reason about and implement correctly. It is **adaptive** — its inner loop terminates early when the element is already in place — giving O(n) performance on nearly-sorted input, far better than the O(n²) average case.

Insertion Sort is both **stable** and **online**: it can sort a list as it receives elements one at a time without needing to know the full input in advance. These properties, combined with excellent cache behaviour and tiny constant factors, make it the algorithm of choice for small n, and it is used as a base case inside Timsort and Introsort in many standard libraries.`,

  realWorldUsage: [
    {
      system: "CPython / Java / V8 — Timsort",
      useCase: "Sorting small runs within the larger merge-sort pass",
      why: "Timsort (used in Python, Java Arrays.sort for objects, and V8) identifies natural runs in the data and uses Insertion Sort for runs shorter than ~64 elements. At this scale, Insertion Sort's cache-friendly sequential access and zero allocation overhead beat merge sort's divide-and-conquer bookkeeping.",
    },
    {
      system: "C++ std::sort (libstdc++ Introsort)",
      useCase: "Base-case sort for small subpartitions",
      why: "GCC's std::sort switches from quicksort to Insertion Sort once a partition is ≤ 16 elements. The threshold is empirically tuned: below it, Insertion Sort's tight loop and in-place shifting outperform quicksort's pivot selection and recursion overhead.",
    },
    {
      system: "Online streaming / real-time data ingestion",
      useCase: "Maintaining a sorted buffer of incoming events",
      why: "Because Insertion Sort is an online algorithm, it can process each new element as it arrives and slot it into the correct position in an already-sorted buffer in O(n) time without restarting. This is used in time-series event queues where events arrive nearly in order and the buffer must stay sorted for range queries.",
    },
  ],

  complexity: {
    time: { best: "O(n)", average: "O(n²)", worst: "O(n²)" },
    space: "O(1)",
    stable: true,
    inPlace: true,
    online: true,
  },

  related: ["bubble-sort", "merge-sort", "binary-search"],
  implemented: true,
  defaultInput: DEFAULT_SORT_INPUT,
  generateSteps,

  code: {
    typescript: `function insertionSort(arr: number[]): number[] {
  const a = [...arr];

  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;

    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      j--;
    }

    a[j + 1] = key;
  }

  return a;
}

// Usage
console.log(insertionSort([38, 27, 43, 3, 9, 82, 10, 55]));
// [3, 9, 10, 27, 38, 43, 55, 82]`,

    go: `package main

import "fmt"

func insertionSort(arr []int) []int {
	a := make([]int, len(arr))
	copy(a, arr)

	for i := 1; i < len(a); i++ {
		key := a[i]
		j := i - 1

		for j >= 0 && a[j] > key {
			a[j+1] = a[j]
			j--
		}

		a[j+1] = key
	}

	return a
}

func main() {
	input := []int{38, 27, 43, 3, 9, 82, 10, 55}
	fmt.Println(insertionSort(input))
	// [3 9 10 27 38 43 55 82]
}`,

    rust: `fn insertion_sort(arr: &[i32]) -> Vec<i32> {
    let mut a = arr.to_vec();

    for i in 1..a.len() {
        let key = a[i];
        let mut j = i;

        while j > 0 && a[j - 1] > key {
            a[j] = a[j - 1];
            j -= 1;
        }

        a[j] = key;
    }

    a
}

fn main() {
    let input = [38, 27, 43, 3, 9, 82, 10, 55];
    println!("{:?}", insertion_sort(&input));
    // [3, 9, 10, 27, 38, 43, 55, 82]
}`,
  },
};
