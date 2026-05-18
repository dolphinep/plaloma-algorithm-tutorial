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

  // Initial snapshot — all bars in default state
  const initial: BarState[] = Array(n).fill("default");
  steps.push(
    snap(arr, initial, comparisons, swaps, "Starting Bubble Sort. All elements are unsorted.")
  );

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // Mark the two elements being compared
      const comparing: BarState[] = Array(n).fill("default");
      for (let k = n - i; k < n; k++) comparing[k] = "sorted";
      comparing[j] = "comparing";
      comparing[j + 1] = "comparing";
      comparisons++;

      steps.push(
        snap(
          arr,
          comparing,
          comparisons,
          swaps,
          `Pass ${i + 1}: Compare arr[${j}]=${arr[j]} and arr[${j + 1}]=${arr[j + 1]}.`,
          i + 1,
          { i, j, "arr[j]": arr[j], "arr[j+1]": arr[j + 1] }
        )
      );

      if (arr[j] > arr[j + 1]) {
        // Show swap state before performing it
        const swapping: BarState[] = Array(n).fill("default");
        for (let k = n - i; k < n; k++) swapping[k] = "sorted";
        swapping[j] = "swapping";
        swapping[j + 1] = "swapping";

        steps.push(
          snap(
            arr,
            swapping,
            comparisons,
            swaps,
            `arr[${j}]=${arr[j]} > arr[${j + 1}]=${arr[j + 1]} — swapping.`,
            i + 1,
            { i, j, "arr[j]": arr[j], "arr[j+1]": arr[j + 1] }
          )
        );

        // Perform the swap
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swaps++;
      }
    }

    // The element that has bubbled to its final position
    const afterPass: BarState[] = Array(n).fill("default");
    for (let k = n - i - 1; k < n; k++) afterPass[k] = "sorted";

    steps.push(
      snap(
        arr,
        afterPass,
        comparisons,
        swaps,
        `Pass ${i + 1} complete — element ${arr[n - i - 1]} is in its final position.`,
        i + 1
      )
    );
  }

  // Final snapshot — everything sorted
  steps.push(
    snap(arr, allSorted(n), comparisons, swaps, "Array is fully sorted.")
  );

  return steps;
}

export const bubbleSort: AlgorithmDefinition<SortingInput, SortingState> = {
  slug: "bubble-sort",
  name: "Bubble Sort",
  category: "sorting",
  difficulty: "beginner",
  tags: ["comparison", "stable", "in-place"],
  summary: "Repeatedly swap adjacent elements that are out of order until the array is sorted.",

  description: `Bubble Sort works by repeatedly stepping through the list and comparing each pair of adjacent elements. If a pair is in the wrong order, they are swapped. After each full pass, the largest unsorted element has "bubbled up" to its correct position at the end of the unsorted region, so the next pass can stop one position earlier.

The algorithm gets its name from the way smaller elements gradually rise to the top like bubbles in water. While simple to understand and implement, it performs O(n²) comparisons in the average and worst cases, making it impractical for large datasets. An early-exit optimisation — stopping if no swaps occurred during a pass — gives it an O(n) best case on already-sorted input.

Bubble Sort is **stable**: equal elements are never swapped, so their relative order is preserved throughout the process. It also sorts **in-place**, requiring only a single extra variable for the swap, giving O(1) auxiliary space.`,

  realWorldUsage: [
    {
      system: "CS Education / Teaching tools",
      useCase: "First sorting algorithm taught in introductory courses",
      why: "Its mechanics map directly onto the definition of sorting — compare neighbours, swap if wrong — with no hidden bookkeeping. This makes it ideal for explaining the concept of comparison-based sorting before introducing more efficient algorithms.",
    },
    {
      system: "Embedded / resource-constrained firmware",
      useCase: "Sorting small, nearly-sorted sensor readings",
      why: "On microcontrollers with kilobytes of RAM, the O(1) space usage and trivially small code footprint matter more than asymptotic efficiency when n is tiny (e.g. 4–16 ADC samples). The early-exit variant is particularly attractive for data that changes only slightly between reads.",
    },
    {
      system: "Graphics / rendering pipelines (historical)",
      useCase: "Painter's algorithm depth sorting",
      why: "Early 3-D software renderers used bubble sort to order a small number of polygons by depth before painting back-to-front. The frame-to-frame coherence of polygon order meant the list was almost sorted every tick, making bubble sort's O(n) best case a practical win.",
    },
  ],

  complexity: {
    time: { best: "O(n)", average: "O(n²)", worst: "O(n²)" },
    space: "O(1)",
    stable: true,
    inPlace: true,
  },

  related: ["selection-sort", "insertion-sort"],
  implemented: true,
  defaultInput: DEFAULT_SORT_INPUT,
  generateSteps,

  code: {
    typescript: `function bubbleSort(arr: number[]): number[] {
  const a = [...arr];
  const n = a.length;

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;

    for (let j = 0; j < n - i - 1; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }

    // Early exit: no swaps means the array is already sorted
    if (!swapped) break;
  }

  return a;
}

// Usage
console.log(bubbleSort([38, 27, 43, 3, 9, 82, 10, 55]));
// [3, 9, 10, 27, 38, 43, 55, 82]`,

    go: `package main

import "fmt"

func bubbleSort(arr []int) []int {
	a := make([]int, len(arr))
	copy(a, arr)
	n := len(a)

	for i := 0; i < n-1; i++ {
		swapped := false

		for j := 0; j < n-i-1; j++ {
			if a[j] > a[j+1] {
				a[j], a[j+1] = a[j+1], a[j]
				swapped = true
			}
		}

		// Early exit: already sorted
		if !swapped {
			break
		}
	}

	return a
}

func main() {
	input := []int{38, 27, 43, 3, 9, 82, 10, 55}
	fmt.Println(bubbleSort(input))
	// [3 9 10 27 38 43 55 82]
}`,

    rust: `fn bubble_sort(arr: &[i32]) -> Vec<i32> {
    let mut a = arr.to_vec();
    let n = a.len();

    for i in 0..n.saturating_sub(1) {
        let mut swapped = false;

        for j in 0..n - i - 1 {
            if a[j] > a[j + 1] {
                a.swap(j, j + 1);
                swapped = true;
            }
        }

        // Early exit: already sorted
        if !swapped {
            break;
        }
    }

    a
}

fn main() {
    let input = [38, 27, 43, 3, 9, 82, 10, 55];
    println!("{:?}", bubble_sort(&input));
    // [3, 9, 10, 27, 38, 43, 55, 82]
}`,
  },
};
