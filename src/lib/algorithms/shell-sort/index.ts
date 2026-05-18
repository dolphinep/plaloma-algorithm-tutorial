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
    snap(arr, initial, comparisons, swaps, "Starting Shell Sort. Will perform gap-insertion passes with decreasing gaps.")
  );

  for (let gap = Math.floor(n / 2); gap >= 1; gap = Math.floor(gap / 2)) {
    steps.push(
      snap(arr, Array(n).fill("default"), comparisons, swaps, `Gap = ${gap}. Starting gap-insertion pass.`, gap, { gap })
    );

    for (let i = gap; i < n; i++) {
      const key = arr[i];
      let j = i;

      while (j >= gap) {
        const compareStates: BarState[] = Array(n).fill("default");
        compareStates[j] = "comparing";
        compareStates[j - gap] = "comparing";
        comparisons++;

        steps.push(
          snap(arr, compareStates, comparisons, swaps, `Gap=${gap}: Compare arr[${j - gap}]=${arr[j - gap]} and arr[${j}]=${arr[j]}.`, gap, { gap, i, j, "arr[j-gap]": arr[j - gap], "arr[j]": arr[j] })
        );

        if (arr[j - gap] > key) {
          const swapStates: BarState[] = Array(n).fill("default");
          swapStates[j] = "swapping";
          swapStates[j - gap] = "swapping";

          steps.push(
            snap(arr, swapStates, comparisons, swaps, `Swapping ${arr[j - gap]} and ${arr[j]}.`, gap, { gap, i, j, "arr[j-gap]": arr[j - gap], "arr[j]": arr[j] })
          );

          arr[j] = arr[j - gap];
          swaps++;
          j -= gap;
        } else {
          break;
        }
      }

      arr[j] = key;
    }

    const afterPassStates: BarState[] = Array(n).fill("default");
    steps.push(
      snap(arr, afterPassStates, comparisons, swaps, `Gap ${gap} pass complete.`, gap, { gap })
    );
  }

  steps.push(
    snap(arr, allSorted(n), comparisons, swaps, "Array is fully sorted.")
  );

  return steps;
}

export const shellSort: AlgorithmDefinition<SortingInput, SortingState> = {
  slug: "shell-sort",
  name: "Shell Sort",
  category: "sorting",
  difficulty: "intermediate",
  tags: ["comparison", "in-place", "gap-sequence", "adaptive"],
  summary: "A generalisation of insertion sort that sorts elements far apart first, progressively reducing the gap until a final gap-1 pass finishes the sort.",

  description: `Shell Sort is a generalisation of Insertion Sort that breaks its O(n²) worst case by first comparing and swapping elements that are far apart, then progressively narrowing the gap until a final pass with gap = 1 completes the sort. By the time the final insertion-sort pass runs, the array is nearly sorted, so very few shifts are required.

The algorithm's performance depends on the chosen gap sequence. The simple halving sequence (n/2, n/4, …, 1) used here gives O(n²) worst-case, but Hibbard's (2^k − 1), Sedgewick's, or Ciura's empirically optimised sequences can reduce the average case to O(n^{4/3}) or better. This flexibility makes Shell Sort one of the few sorting algorithms whose complexity is still an active research topic.

Shell Sort is **in-place** and requires no auxiliary arrays, making it attractive for memory-constrained environments. It is **not stable** — widely spaced swaps can change the relative order of equal elements. Its lack of recursion and minimal branching give it a very small code footprint, a property valued in embedded and firmware contexts.`,

  realWorldUsage: [
    {
      system: "uClibc / musl libc",
      useCase: "Used as the default sort in some embedded C standard libraries",
      why: "musl libc's qsort implementation historically used a variant of Shell Sort. The in-place, non-recursive nature keeps the compiled binary tiny — critical for embedded Linux systems where libc must fit in kilobytes of flash storage.",
    },
    {
      system: "Early Unix kernels",
      useCase: "Shell sort appeared in early Unix sort utilities due to simplicity",
      why: "The original Unix sort utility used Shell Sort because it was compact enough to fit in the constrained address space of PDP-11 systems, required no dynamic memory allocation, and performed well enough on the small file sizes of the era.",
    },
    {
      system: "Embedded systems (firmware)",
      useCase: "Small code footprint, no recursion, O(1) extra space",
      why: "Firmware targeting microcontrollers (ARM Cortex-M0, AVR) often cannot use stack-heavy recursive algorithms. Shell Sort's iterative structure, constant extra space, and single array make it a practical choice for sorting sensor tables, lookup tables, or configuration entries at startup.",
    },
  ],

  complexity: {
    time: { best: "O(n log n)", average: "O(n log² n)", worst: "O(n²)" },
    space: "O(1)",
    stable: false,
    inPlace: true,
  },

  related: ["insertion-sort", "quick-sort"],
  implemented: true,
  defaultInput: DEFAULT_SORT_INPUT,
  generateSteps,

  code: {
    typescript: `function shellSort(arr: number[]): number[] {
  const a = [...arr];
  const n = a.length;

  for (let gap = Math.floor(n / 2); gap >= 1; gap = Math.floor(gap / 2)) {
    for (let i = gap; i < n; i++) {
      const key = a[i];
      let j = i;

      while (j >= gap && a[j - gap] > key) {
        a[j] = a[j - gap];
        j -= gap;
      }

      a[j] = key;
    }
  }

  return a;
}

// Usage
console.log(shellSort([38, 27, 43, 3, 9, 82, 10, 55]));
// [3, 9, 10, 27, 38, 43, 55, 82]`,

    go: `package main

import "fmt"

func shellSort(arr []int) []int {
	a := make([]int, len(arr))
	copy(a, arr)
	n := len(a)

	for gap := n / 2; gap >= 1; gap /= 2 {
		for i := gap; i < n; i++ {
			key := a[i]
			j := i

			for j >= gap && a[j-gap] > key {
				a[j] = a[j-gap]
				j -= gap
			}

			a[j] = key
		}
	}

	return a
}

func main() {
	input := []int{38, 27, 43, 3, 9, 82, 10, 55}
	fmt.Println(shellSort(input))
	// [3 9 10 27 38 43 55 82]
}`,

    rust: `fn shell_sort(arr: &[i32]) -> Vec<i32> {
    let mut a = arr.to_vec();
    let n = a.len();
    let mut gap = n / 2;

    while gap >= 1 {
        for i in gap..n {
            let key = a[i];
            let mut j = i;

            while j >= gap && a[j - gap] > key {
                a[j] = a[j - gap];
                j -= gap;
            }

            a[j] = key;
        }

        gap /= 2;
    }

    a
}

fn main() {
    let input = [38, 27, 43, 3, 9, 82, 10, 55];
    println!("{:?}", shell_sort(&input));
    // [3, 9, 10, 27, 38, 43, 55, 82]
}`,
  },
};
