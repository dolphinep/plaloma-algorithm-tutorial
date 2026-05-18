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

  // Track which indices are permanently sorted
  const sortedSet = new Set<number>();

  const buildStates = (extras: Partial<Record<number, BarState>>): BarState[] => {
    const states: BarState[] = Array(n).fill("default");
    for (const idx of sortedSet) states[idx] = "sorted";
    for (const [k, v] of Object.entries(extras)) states[Number(k)] = v as BarState;
    return states;
  };

  const initial: BarState[] = Array(n).fill("default");
  steps.push(
    snap(arr, initial, comparisons, swaps, "Starting Quick Sort (iterative). Using last element as pivot.")
  );

  // Iterative quicksort with explicit stack
  const stack: [number, number][] = [[0, n - 1]];

  while (stack.length > 0) {
    const [low, high] = stack.pop()!;

    if (low >= high) {
      // single element — mark as sorted
      if (low === high && !sortedSet.has(low)) {
        sortedSet.add(low);
        steps.push(
          snap(
            arr,
            buildStates({}),
            comparisons,
            swaps,
            `Single element arr[${low}]=${arr[low]} is in its final position.`,
            undefined,
            { low, high }
          )
        );
      }
      continue;
    }

    const pivot = arr[high];

    // Mark pivot
    steps.push(
      snap(
        arr,
        buildStates({ [high]: "pivot" }),
        comparisons,
        swaps,
        `Partitioning [${low}..${high}]. Pivot = arr[${high}] = ${pivot}.`,
        undefined,
        { low, high, pivot }
      )
    );

    let i = low - 1;

    for (let j = low; j < high; j++) {
      comparisons++;

      // Show element being compared against pivot
      steps.push(
        snap(
          arr,
          buildStates({ [high]: "pivot", [j]: "comparing" }),
          comparisons,
          swaps,
          `Compare arr[${j}]=${arr[j]} with pivot ${pivot}.`,
          undefined,
          { i, j, "arr[j]": arr[j], pivot }
        )
      );

      if (arr[j] <= pivot) {
        i++;
        if (i !== j) {
          // Show swap
          steps.push(
            snap(
              arr,
              buildStates({ [high]: "pivot", [i]: "swapping", [j]: "swapping" }),
              comparisons,
              swaps,
              `arr[${j}]=${arr[j]} ≤ pivot — swap with arr[${i}]=${arr[i]}.`,
              undefined,
              { i, j, "arr[i]": arr[i], "arr[j]": arr[j], pivot }
            )
          );
          [arr[i], arr[j]] = [arr[j], arr[i]];
          swaps++;
        } else {
          steps.push(
            snap(
              arr,
              buildStates({ [high]: "pivot", [i]: "active" }),
              comparisons,
              swaps,
              `arr[${j}]=${arr[j]} ≤ pivot — already in place, advance i.`,
              undefined,
              { i, j, "arr[j]": arr[j], pivot }
            )
          );
        }
      }
    }

    // Place pivot in its final position
    const pivotIdx = i + 1;
    if (pivotIdx !== high) {
      steps.push(
        snap(
          arr,
          buildStates({ [high]: "pivot", [pivotIdx]: "swapping" }),
          comparisons,
          swaps,
          `Place pivot ${pivot} at its final position arr[${pivotIdx}].`,
          undefined,
          { pivotIdx, "arr[pivotIdx]": arr[pivotIdx], pivot }
        )
      );
      [arr[pivotIdx], arr[high]] = [arr[high], arr[pivotIdx]];
      swaps++;
    }

    sortedSet.add(pivotIdx);

    steps.push(
      snap(
        arr,
        buildStates({}),
        comparisons,
        swaps,
        `Pivot ${pivot} is now at index ${pivotIdx} — its final sorted position.`,
        undefined,
        { pivotIdx }
      )
    );

    // Push subarrays onto the stack
    if (pivotIdx - 1 > low) stack.push([low, pivotIdx - 1]);
    else if (pivotIdx - 1 === low) { sortedSet.add(low); }

    if (pivotIdx + 1 < high) stack.push([pivotIdx + 1, high]);
    else if (pivotIdx + 1 === high) { sortedSet.add(high); }
  }

  steps.push(
    snap(arr, allSorted(n), comparisons, swaps, "Array is fully sorted.")
  );

  return steps;
}

export const quickSort: AlgorithmDefinition<SortingInput, SortingState> = {
  slug: "quick-sort",
  name: "Quick Sort",
  category: "sorting",
  difficulty: "intermediate",
  tags: ["comparison", "in-place", "divide-and-conquer"],
  summary: "Select a pivot, partition elements around it, then recursively sort each partition.",

  description: `Quick Sort works by selecting a **pivot** element and rearranging the array so that every element smaller than or equal to the pivot ends up to its left and every larger element ends up to its right. The pivot is then in its final sorted position. The algorithm repeats this partitioning process on the left and right sub-partitions, continuing until all sub-partitions contain a single element.

This implementation uses Lomuto's partitioning scheme with the last element as the pivot and an explicit stack instead of recursion, which avoids stack-overflow risks on large inputs. The partition step scans the subarray with a pointer j; whenever it finds an element ≤ pivot, it swaps it with the element at the boundary pointer i, steadily building the "≤ pivot" region on the left. At the end, the pivot is swapped into position i+1.

The average and best-case time complexity is O(n log n), but the worst case degrades to O(n²) when the input is already sorted (or reverse-sorted) and a naive last-element pivot is used — because each partition contains n−1 elements on one side. Production implementations avoid this with randomised pivot selection or the median-of-three heuristic. Quick Sort is **not stable** and sorts **in-place** using only O(log n) stack space on average.`,

  realWorldUsage: [
    {
      system: "C standard library — qsort",
      useCase: "General-purpose comparison sort for arrays of any type",
      why: "Many C runtime implementations (glibc, musl) use an introsort — quicksort with a fallback to heapsort when recursion depth exceeds 2 log₂ n — as the backend for qsort. Quicksort's in-place nature and cache-friendly sequential access make it fast in practice for random data.",
    },
    {
      system: "C++ std::sort (Introsort)",
      useCase: "Default sort algorithm in the C++ Standard Library",
      why: "GCC's libstdc++ and LLVM's libc++ implement std::sort as introsort: quicksort with a heapsort fallback to guarantee O(n log n) worst case and insertion sort for small partitions. The combination exploits quicksort's average-case speed while eliminating its pathological worst case.",
    },
    {
      system: "V8 JavaScript engine — Array.prototype.sort",
      useCase: "Sorting large JavaScript arrays of numbers",
      why: "V8 uses Timsort for all arrays, but internally it employs a quicksort-derived partition for the in-place sorting of large numeric arrays where element copying is cheap. Quicksort's minimal allocation overhead and CPU-cache-friendly access patterns matter at the scale of millions of JS operations per second.",
    },
  ],

  complexity: {
    time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)" },
    space: "O(log n)",
    stable: false,
    inPlace: true,
  },

  related: ["merge-sort", "heap-sort", "binary-search"],
  implemented: true,
  defaultInput: DEFAULT_SORT_INPUT,
  generateSteps,

  code: {
    typescript: `function quickSort(arr: number[], low = 0, high = arr.length - 1): number[] {
  const a = low === 0 && high === arr.length - 1 ? [...arr] : arr;

  if (low < high) {
    const pivotIdx = partition(a, low, high);
    quickSort(a, low, pivotIdx - 1);
    quickSort(a, pivotIdx + 1, high);
  }

  return a;
}

function partition(arr: number[], low: number, high: number): number {
  const pivot = arr[high];
  let i = low - 1;

  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}

// Usage
console.log(quickSort([38, 27, 43, 3, 9, 82, 10, 55]));
// [3, 9, 10, 27, 38, 43, 55, 82]`,

    go: `package main

import "fmt"

func quickSort(arr []int) []int {
	a := make([]int, len(arr))
	copy(a, arr)
	qsort(a, 0, len(a)-1)
	return a
}

func qsort(arr []int, low, high int) {
	if low < high {
		p := partition(arr, low, high)
		qsort(arr, low, p-1)
		qsort(arr, p+1, high)
	}
}

func partition(arr []int, low, high int) int {
	pivot := arr[high]
	i := low - 1

	for j := low; j < high; j++ {
		if arr[j] <= pivot {
			i++
			arr[i], arr[j] = arr[j], arr[i]
		}
	}

	arr[i+1], arr[high] = arr[high], arr[i+1]
	return i + 1
}

func main() {
	input := []int{38, 27, 43, 3, 9, 82, 10, 55}
	fmt.Println(quickSort(input))
	// [3 9 10 27 38 43 55 82]
}`,

    rust: `fn quick_sort(arr: &[i32]) -> Vec<i32> {
    let mut a = arr.to_vec();
    let n = a.len();
    if n > 1 {
        qsort(&mut a, 0, n - 1);
    }
    a
}

fn qsort(arr: &mut Vec<i32>, low: usize, high: usize) {
    if low < high {
        let p = partition(arr, low, high);
        if p > 0 { qsort(arr, low, p - 1); }
        qsort(arr, p + 1, high);
    }
}

fn partition(arr: &mut Vec<i32>, low: usize, high: usize) -> usize {
    let pivot = arr[high];
    let mut i = low;

    for j in low..high {
        if arr[j] <= pivot {
            arr.swap(i, j);
            i += 1;
        }
    }

    arr.swap(i, high);
    i
}

fn main() {
    let input = [38, 27, 43, 3, 9, 82, 10, 55];
    println!("{:?}", quick_sort(&input));
    // [3, 9, 10, 27, 38, 43, 55, 82]
}`,
  },
};
