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

  // sortedFrom tracks the boundary of the sorted region (indices >= sortedFrom are sorted)
  let sortedFrom = n;

  const buildStates = (extras: Partial<Record<number, BarState>>): BarState[] => {
    const states: BarState[] = Array(n).fill("default");
    for (let k = sortedFrom; k < n; k++) states[k] = "sorted";
    for (const [k, v] of Object.entries(extras)) states[Number(k)] = v as BarState;
    return states;
  };

  // Iterative heapify-down: sift node i down within heap of size heapSize
  // Returns the steps generated inline (mutates arr, comparisons, swaps)
  const heapify = (heapSize: number, i: number) => {
    let root = i;

    while (true) {
      const left = 2 * root + 1;
      const right = 2 * root + 2;
      let largest = root;

      // Show root as active, compare with children
      if (left < heapSize) {
        comparisons++;
        const childStates: Partial<Record<number, BarState>> = {
          [root]: "active",
          [left]: "comparing",
        };
        if (right < heapSize) childStates[right] = "comparing";

        steps.push(
          snap(
            arr,
            buildStates(childStates),
            comparisons,
            swaps,
            `Heapify at ${root}: compare arr[${root}]=${arr[root]} with children${right < heapSize ? ` arr[${left}]=${arr[left]}, arr[${right}]=${arr[right]}` : ` arr[${left}]=${arr[left]}`}.`,
            undefined,
            { root, left, right: right < heapSize ? right : -1 }
          )
        );

        if (arr[left] > arr[largest]) largest = left;
        if (right < heapSize && arr[right] > arr[largest]) {
          comparisons++;
          largest = right;
        }
      } else {
        // Leaf node — nothing to do
        break;
      }

      if (largest === root) {
        steps.push(
          snap(
            arr,
            buildStates({ [root]: "active" }),
            comparisons,
            swaps,
            `arr[${root}]=${arr[root]} is already the largest — heap property satisfied.`,
            undefined,
            { root }
          )
        );
        break;
      }

      // Swap root with largest child
      steps.push(
        snap(
          arr,
          buildStates({ [root]: "swapping", [largest]: "swapping" }),
          comparisons,
          swaps,
          `arr[${largest}]=${arr[largest]} > arr[${root}]=${arr[root]} — swap to restore heap.`,
          undefined,
          { root, largest, "arr[root]": arr[root], "arr[largest]": arr[largest] }
        )
      );

      [arr[root], arr[largest]] = [arr[largest], arr[root]];
      swaps++;
      root = largest;
    }
  };

  // --- Phase 1: Build max-heap ---
  steps.push(
    snap(arr, buildStates({}), comparisons, swaps, "Phase 1: Building max-heap from the bottom up.")
  );

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    steps.push(
      snap(
        arr,
        buildStates({ [i]: "active" }),
        comparisons,
        swaps,
        `Heapify subtree rooted at index ${i} (arr[${i}]=${arr[i]}).`,
        undefined,
        { i }
      )
    );
    heapify(n, i);
  }

  steps.push(
    snap(
      arr,
      buildStates({}),
      comparisons,
      swaps,
      "Max-heap built. arr[0] holds the largest element."
    )
  );

  // --- Phase 2: Extract elements from heap ---
  steps.push(
    snap(arr, buildStates({}), comparisons, swaps, "Phase 2: Extracting elements — swap root with last, then re-heapify.")
  );

  for (let i = n - 1; i > 0; i--) {
    // Swap root (max) with the last unsorted element
    steps.push(
      snap(
        arr,
        buildStates({ [0]: "swapping", [i]: "swapping" }),
        comparisons,
        swaps,
        `Swap root arr[0]=${arr[0]} with arr[${i}]=${arr[i]}. arr[${i}] goes to its final position.`,
        undefined,
        { "arr[0]": arr[0], i }
      )
    );

    [arr[0], arr[i]] = [arr[i], arr[0]];
    swaps++;
    sortedFrom = i;

    steps.push(
      snap(
        arr,
        buildStates({}),
        comparisons,
        swaps,
        `arr[${i}]=${arr[i]} is now sorted. Re-heapify the remaining ${i} elements.`,
        undefined,
        { sortedFrom }
      )
    );

    heapify(i, 0);
  }

  steps.push(
    snap(arr, allSorted(n), comparisons, swaps, "Array is fully sorted.")
  );

  return steps;
}

export const heapSort: AlgorithmDefinition<SortingInput, SortingState> = {
  slug: "heap-sort",
  name: "Heap Sort",
  category: "sorting",
  difficulty: "intermediate",
  tags: ["comparison", "in-place", "selection-based"],
  summary: "Build a max-heap from the array, then repeatedly extract the maximum element to sort in-place.",

  description: `Heap Sort works in two phases, both centred on the **max-heap** property: every parent node is greater than or equal to its children. In Phase 1 the algorithm transforms the raw array into a valid max-heap by calling heapify on every internal node from bottom to top — a process that takes O(n) time. Once the heap is built, arr[0] holds the largest element.

Phase 2 extracts elements in descending order. The root (largest) is swapped with the last element of the unsorted region, shrinking the heap by one and placing that element in its final sorted position. The new root is then sifted down through the reduced heap to restore the heap property. This extraction loop runs n−1 times, and each sift-down takes O(log n) work, giving O(n log n) total for the phase — and therefore O(n log n) overall in all cases.

Unlike Merge Sort, Heap Sort requires no extra memory beyond a few loop variables, making it an **in-place** O(1)-space algorithm. Unlike Quick Sort, its worst case is also O(n log n), so it provides absolute performance guarantees. The trade-off is poor cache behaviour: the sift-down operation accesses elements at indices 2i+1 and 2i+2, which are far apart for large heaps, leading to many cache misses compared to the sequential access patterns of merge sort or insertion sort.`,

  realWorldUsage: [
    {
      system: "Linux kernel — lib/sort.c",
      useCase: "In-kernel sorting with guaranteed O(n log n) and zero allocation",
      why: "The Linux kernel cannot call malloc during many critical paths. lib/sort.c implements heapsort because it provides O(n log n) worst-case performance with strictly O(1) auxiliary space — both properties are required in interrupt handlers and memory-constrained kernel contexts where dynamic allocation is forbidden.",
    },
    {
      system: "C++ std::partial_sort",
      useCase: "Retrieving the k smallest elements from a large collection",
      why: "std::partial_sort builds a min-heap of size k over the first k elements, then sifts each remaining element through it. Because only k elements need to be sorted, the total cost is O(n log k) rather than O(n log n). This heap-based strategy is the standard implementation choice in libstdc++ and libc++.",
    },
    {
      system: "Embedded and safety-critical systems",
      useCase: "Deterministic sorting with bounded worst-case time and no allocation",
      why: "In real-time systems (automotive ECUs, avionics, PLCs) algorithms must meet hard timing deadlines. Heap sort's O(n log n) worst-case guarantee — with no dynamic memory allocation and a small, fixed code footprint — makes it a reliable choice when predictability matters more than raw average-case speed.",
    },
  ],

  complexity: {
    time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
    space: "O(1)",
    stable: false,
    inPlace: true,
  },

  related: ["merge-sort", "quick-sort", "priority-queue"],
  implemented: true,
  defaultInput: DEFAULT_SORT_INPUT,
  generateSteps,

  code: {
    typescript: `function heapSort(arr: number[]): number[] {
  const a = [...arr];
  const n = a.length;

  // Build max-heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(a, n, i);
  }

  // Extract elements one by one
  for (let i = n - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    heapify(a, i, 0);
  }

  return a;
}

function heapify(arr: number[], size: number, root: number): void {
  let largest = root;
  const left = 2 * root + 1;
  const right = 2 * root + 2;

  if (left < size && arr[left] > arr[largest]) largest = left;
  if (right < size && arr[right] > arr[largest]) largest = right;

  if (largest !== root) {
    [arr[root], arr[largest]] = [arr[largest], arr[root]];
    heapify(arr, size, largest);
  }
}

// Usage
console.log(heapSort([38, 27, 43, 3, 9, 82, 10, 55]));
// [3, 9, 10, 27, 38, 43, 55, 82]`,

    go: `package main

import "fmt"

func heapSort(arr []int) []int {
	a := make([]int, len(arr))
	copy(a, arr)
	n := len(a)

	// Build max-heap
	for i := n/2 - 1; i >= 0; i-- {
		heapify(a, n, i)
	}

	// Extract elements one by one
	for i := n - 1; i > 0; i-- {
		a[0], a[i] = a[i], a[0]
		heapify(a, i, 0)
	}

	return a
}

func heapify(arr []int, size, root int) {
	largest := root
	left := 2*root + 1
	right := 2*root + 2

	if left < size && arr[left] > arr[largest] {
		largest = left
	}
	if right < size && arr[right] > arr[largest] {
		largest = right
	}

	if largest != root {
		arr[root], arr[largest] = arr[largest], arr[root]
		heapify(arr, size, largest)
	}
}

func main() {
	input := []int{38, 27, 43, 3, 9, 82, 10, 55}
	fmt.Println(heapSort(input))
	// [3 9 10 27 38 43 55 82]
}`,

    rust: `fn heap_sort(arr: &[i32]) -> Vec<i32> {
    let mut a = arr.to_vec();
    let n = a.len();

    // Build max-heap
    for i in (0..n / 2).rev() {
        heapify(&mut a, n, i);
    }

    // Extract elements one by one
    for i in (1..n).rev() {
        a.swap(0, i);
        heapify(&mut a, i, 0);
    }

    a
}

fn heapify(arr: &mut Vec<i32>, size: usize, root: usize) {
    let mut largest = root;
    let left = 2 * root + 1;
    let right = 2 * root + 2;

    if left < size && arr[left] > arr[largest] {
        largest = left;
    }
    if right < size && arr[right] > arr[largest] {
        largest = right;
    }

    if largest != root {
        arr.swap(root, largest);
        heapify(arr, size, largest);
    }
}

fn main() {
    let input = [38, 27, 43, 3, 9, 82, 10, 55];
    println!("{:?}", heap_sort(&input));
    // [3, 9, 10, 27, 38, 43, 55, 82]
}`,
  },
};
