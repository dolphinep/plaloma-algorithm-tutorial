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

  // Initial snapshot
  const initial: BarState[] = Array(n).fill("default");
  steps.push(
    snap(arr, initial, comparisons, swaps, "Starting Selection Sort. Find the minimum element and move it to the front.")
  );

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    // Mark current position as active (candidate for placement)
    const scanStart: BarState[] = Array(n).fill("default");
    for (let k = 0; k < i; k++) scanStart[k] = "sorted";
    scanStart[i] = "active";

    steps.push(
      snap(
        arr,
        scanStart,
        comparisons,
        swaps,
        `Pass ${i + 1}: Assume arr[${i}]=${arr[i]} is the minimum. Scanning the unsorted region.`,
        i + 1,
        { i, minIdx, "arr[minIdx]": arr[minIdx] }
      )
    );

    for (let j = i + 1; j < n; j++) {
      // Show the comparison: current minimum is 'active', candidate is 'comparing'
      const scanning: BarState[] = Array(n).fill("default");
      for (let k = 0; k < i; k++) scanning[k] = "sorted";
      scanning[minIdx] = "active";
      scanning[j] = "comparing";
      comparisons++;

      steps.push(
        snap(
          arr,
          scanning,
          comparisons,
          swaps,
          `Compare arr[${j}]=${arr[j]} with current min arr[${minIdx}]=${arr[minIdx]}.`,
          i + 1,
          { i, j, minIdx, "arr[j]": arr[j], "arr[minIdx]": arr[minIdx] }
        )
      );

      if (arr[j] < arr[minIdx]) {
        minIdx = j;

        // Update active marker to new minimum
        const newMin: BarState[] = Array(n).fill("default");
        for (let k = 0; k < i; k++) newMin[k] = "sorted";
        newMin[minIdx] = "active";

        steps.push(
          snap(
            arr,
            newMin,
            comparisons,
            swaps,
            `New minimum found: arr[${minIdx}]=${arr[minIdx]}.`,
            i + 1,
            { i, minIdx, "arr[minIdx]": arr[minIdx] }
          )
        );
      }
    }

    if (minIdx !== i) {
      // Show swap
      const swapping: BarState[] = Array(n).fill("default");
      for (let k = 0; k < i; k++) swapping[k] = "sorted";
      swapping[i] = "swapping";
      swapping[minIdx] = "swapping";

      steps.push(
        snap(
          arr,
          swapping,
          comparisons,
          swaps,
          `Minimum is arr[${minIdx}]=${arr[minIdx]}. Swap with arr[${i}]=${arr[i]}.`,
          i + 1,
          { i, minIdx, "arr[i]": arr[i], "arr[minIdx]": arr[minIdx] }
        )
      );

      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      swaps++;
    }

    // Mark position i as permanently sorted
    const afterPlace: BarState[] = Array(n).fill("default");
    for (let k = 0; k <= i; k++) afterPlace[k] = "sorted";

    steps.push(
      snap(
        arr,
        afterPlace,
        comparisons,
        swaps,
        `arr[${i}]=${arr[i]} is now in its final position.`,
        i + 1
      )
    );
  }

  // Final snapshot
  steps.push(
    snap(arr, allSorted(n), comparisons, swaps, "Array is fully sorted.")
  );

  return steps;
}

export const selectionSort: AlgorithmDefinition<SortingInput, SortingState> = {
  slug: "selection-sort",
  name: "Selection Sort",
  category: "sorting",
  difficulty: "beginner",
  tags: ["comparison", "in-place"],
  summary: "Repeatedly select the minimum element from the unsorted region and move it to the front.",

  description: `Selection Sort divides the array into two parts: a growing sorted region on the left and a shrinking unsorted region on the right. On each pass it scans the entire unsorted region to find the smallest element, then swaps that element into the first position of the unsorted region, extending the sorted region by one.

Unlike Bubble Sort, Selection Sort makes at most n−1 swaps regardless of the input, which can be useful when writes are expensive — for example, on EEPROM or flash memory where each write reduces the cell's lifespan. However, it always performs O(n²) comparisons even on a sorted array, so its best-case cost equals its worst case.

Selection Sort is **not stable** in its standard form: the swap can move an element past others with equal value, changing their relative order. An alternative linked-list implementation can be made stable, but the array version typically is not. It sorts **in-place** with O(1) auxiliary space.`,

  realWorldUsage: [
    {
      system: "Embedded flash / EEPROM firmware",
      useCase: "Sorting configuration records with minimal write cycles",
      why: "Flash memory cells degrade with each write. Selection Sort's guarantee of at most n−1 swaps minimises the number of write operations compared to algorithms like Bubble Sort that may swap the same cell many times.",
    },
    {
      system: "Card dealing / manual sorting processes",
      useCase: "Simulation of human hand-sorting behaviour",
      why: "When humans sort a hand of cards by picking the smallest card and placing it first, they are executing Selection Sort. UI animations that mimic human card-sorting use this algorithm because the motion is intuitively recognisable.",
    },
    {
      system: "Database query optimisers (worst-case bounding)",
      useCase: "Cost estimation for small in-memory result sets",
      why: "For very small n (typically ≤ 8), query planners sometimes fall back to simple O(n²) sorts because cache effects dominate: no pointer chasing, predictable branch patterns, and zero allocations beat the constant factors of merge sort or heap sort at this scale.",
    },
  ],

  complexity: {
    time: { best: "O(n²)", average: "O(n²)", worst: "O(n²)" },
    space: "O(1)",
    stable: false,
    inPlace: true,
  },

  related: ["bubble-sort", "insertion-sort"],
  implemented: true,
  defaultInput: DEFAULT_SORT_INPUT,
  generateSteps,

  code: {
    typescript: `function selectionSort(arr: number[]): number[] {
  const a = [...arr];
  const n = a.length;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    for (let j = i + 1; j < n; j++) {
      if (a[j] < a[minIdx]) {
        minIdx = j;
      }
    }

    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
    }
  }

  return a;
}

// Usage
console.log(selectionSort([38, 27, 43, 3, 9, 82, 10, 55]));
// [3, 9, 10, 27, 38, 43, 55, 82]`,

    go: `package main

import "fmt"

func selectionSort(arr []int) []int {
	a := make([]int, len(arr))
	copy(a, arr)
	n := len(a)

	for i := 0; i < n-1; i++ {
		minIdx := i

		for j := i + 1; j < n; j++ {
			if a[j] < a[minIdx] {
				minIdx = j
			}
		}

		if minIdx != i {
			a[i], a[minIdx] = a[minIdx], a[i]
		}
	}

	return a
}

func main() {
	input := []int{38, 27, 43, 3, 9, 82, 10, 55}
	fmt.Println(selectionSort(input))
	// [3 9 10 27 38 43 55 82]
}`,

    rust: `fn selection_sort(arr: &[i32]) -> Vec<i32> {
    let mut a = arr.to_vec();
    let n = a.len();

    for i in 0..n.saturating_sub(1) {
        let min_idx = (i..n)
            .min_by_key(|&j| a[j])
            .unwrap_or(i);

        if min_idx != i {
            a.swap(i, min_idx);
        }
    }

    a
}

fn main() {
    let input = [38, 27, 43, 3, 9, 82, 10, 55];
    println!("{:?}", selection_sort(&input));
    // [3, 9, 10, 27, 38, 43, 55, 82]
}`,
  },
};
