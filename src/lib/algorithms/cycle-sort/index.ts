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
    snap(arr, initial, comparisons, swaps, "Starting Cycle Sort. Each element will be written to its final position at most once.")
  );

  for (let cs = 0; cs < n - 1; cs++) {
    const item = arr[cs];

    // Count elements smaller than arr[cs] to find correct position
    let pos = cs;
    for (let i = cs + 1; i < n; i++) {
      comparisons++;
      if (arr[i] < item) pos++;
    }

    // Element is already in the right place
    if (pos === cs) {
      const skipStates: BarState[] = Array(n).fill("default");
      skipStates[cs] = "sorted";
      steps.push(
        snap(arr, skipStates, comparisons, swaps, `Cycle start at index ${cs}: value ${item} is already at position ${pos}. Skip.`, undefined, { cs, item, pos })
      );
      continue;
    }

    // Skip duplicates
    while (arr[pos] === item) pos++;

    const announceStates: BarState[] = Array(n).fill("default");
    announceStates[cs] = "pivot";
    announceStates[pos] = "active";
    steps.push(
      snap(arr, announceStates, comparisons, swaps, `Cycle start at index ${cs}: value ${item} belongs at position ${pos}.`, undefined, { cs, item, pos })
    );

    // Place item at pos
    const tmp = arr[pos];
    arr[pos] = item;
    swaps++;

    const writeStates: BarState[] = Array(n).fill("default");
    writeStates[pos] = "swapping";
    writeStates[cs] = "pivot";
    steps.push(
      snap(arr, writeStates, comparisons, swaps, `Writing ${item} to position ${pos}.`, undefined, { cs, item, pos, displaced: tmp })
    );

    // Rotate the rest of the cycle
    let current = tmp;
    while (current !== arr[cs] || pos !== cs) {
      // Recalculate position for the displaced element
      pos = cs;
      for (let i = cs + 1; i < n; i++) {
        comparisons++;
        if (arr[i] < current) pos++;
      }

      // Skip duplicates
      while (arr[pos] === current) pos++;

      const cycleStates: BarState[] = Array(n).fill("default");
      cycleStates[cs] = "pivot";
      cycleStates[pos] = "active";
      steps.push(
        snap(arr, cycleStates, comparisons, swaps, `Cycle continues: value ${current} belongs at position ${pos}.`, undefined, { cs, current, pos })
      );

      const displaced = arr[pos];
      arr[pos] = current;
      swaps++;

      const cycleWriteStates: BarState[] = Array(n).fill("default");
      cycleWriteStates[pos] = "swapping";
      cycleWriteStates[cs] = "pivot";
      steps.push(
        snap(arr, cycleWriteStates, comparisons, swaps, `Writing ${current} to position ${pos}.`, undefined, { cs, current, pos, displaced })
      );

      current = displaced;
    }
  }

  steps.push(
    snap(arr, allSorted(n), comparisons, swaps, "Array is fully sorted.")
  );

  return steps;
}

export const cycleSort: AlgorithmDefinition<SortingInput, SortingState> = {
  slug: "cycle-sort",
  name: "Cycle Sort",
  category: "sorting",
  difficulty: "advanced",
  tags: ["comparison", "in-place", "minimum-writes", "cycle-detection"],
  summary: "Sort by tracing cyclic permutations and writing each element directly to its final position, minimising total array writes.",

  description: `Cycle Sort is an in-place comparison sort uniquely designed to minimise the number of writes to the array. It works by decomposing the permutation of unsorted elements into cycles. For each cycle, the algorithm finds the correct destination of the first element, places it there, and continues rotating the cycle until every element in it is at its final sorted position. Each element is written at most once, giving the theoretical minimum of O(n) writes.

The algorithm achieves this write-optimal property at the cost of O(n²) comparisons. For each element it counts how many other elements are smaller to determine its correct rank, a process that touches every remaining element. This makes Cycle Sort impractical for general-purpose sorting compared to O(n log n) algorithms, but uniquely suited to scenarios where writes are orders of magnitude more expensive than reads.

Cycle Sort is **in-place** with O(1) auxiliary space and **not stable** — elements are moved directly to their final positions, which can change the relative order of equal values. Its write-optimal guarantee is mathematically proven: any comparison sort requires at least as many writes as Cycle Sort in the worst case, which is exactly n - (number of cycles) writes.`,

  realWorldUsage: [
    {
      system: "EEPROM / Flash memory programming",
      useCase: "Minimises write cycles to extend flash lifespan",
      why: "Flash memory cells wear out after a finite number of program/erase cycles (typically 10k–100k). Sorting data in-place with the minimum possible writes directly extends the storage lifetime. Cycle Sort's guarantee of at most n writes (vs. O(n log n) for quicksort) is significant when sorting lookup tables or calibration data stored in flash.",
    },
    {
      system: "Write-once media sorting",
      useCase: "CD/DVD mastering where writes are expensive",
      why: "Write-once optical media cannot be erased. Sorting must be performed in a scratch buffer with minimised write operations before committing. Cycle Sort's minimisation of writes reduces the number of buffer copy operations needed during the mastering pass.",
    },
    {
      system: "Database page updates on write-heavy storage",
      useCase: "Reducing SSD wear levelling overhead",
      why: "SSDs use wear levelling firmware that tracks page write counts. Sorting rows within a database page before a flush with a write-minimising algorithm reduces the number of page writes, decreasing wear levelling pressure and improving write amplification ratios — particularly important for write-intensive OLAP workloads.",
    },
  ],

  complexity: {
    time: { best: "O(n²)", average: "O(n²)", worst: "O(n²)" },
    space: "O(1)",
    stable: false,
    inPlace: true,
  },

  related: ["selection-sort"],
  implemented: true,
  defaultInput: DEFAULT_SORT_INPUT,
  generateSteps,

  code: {
    typescript: `function cycleSort(arr: number[]): number[] {
  const a = [...arr];
  const n = a.length;

  for (let cs = 0; cs < n - 1; cs++) {
    let item = a[cs];

    // Find the correct position for item
    let pos = cs;
    for (let i = cs + 1; i < n; i++) {
      if (a[i] < item) pos++;
    }

    if (pos === cs) continue; // already in place

    // Skip duplicates at destination
    while (a[pos] === item) pos++;

    // Place item and rotate the cycle
    [a[pos], item] = [item, a[pos]];

    while (pos !== cs) {
      pos = cs;
      for (let i = cs + 1; i < n; i++) {
        if (a[i] < item) pos++;
      }
      while (a[pos] === item) pos++;
      [a[pos], item] = [item, a[pos]];
    }
  }

  return a;
}

// Usage
console.log(cycleSort([38, 27, 43, 3, 9, 82, 10, 55]));
// [3, 9, 10, 27, 38, 43, 55, 82]`,

    go: `package main

import "fmt"

func cycleSort(arr []int) []int {
	a := make([]int, len(arr))
	copy(a, arr)
	n := len(a)

	for cs := 0; cs < n-1; cs++ {
		item := a[cs]

		// Find the correct position for item
		pos := cs
		for i := cs + 1; i < n; i++ {
			if a[i] < item {
				pos++
			}
		}

		if pos == cs {
			continue // already in place
		}

		// Skip duplicates at destination
		for a[pos] == item {
			pos++
		}

		// Place item and rotate the cycle
		a[pos], item = item, a[pos]

		for pos != cs {
			pos = cs
			for i := cs + 1; i < n; i++ {
				if a[i] < item {
					pos++
				}
			}
			for a[pos] == item {
				pos++
			}
			a[pos], item = item, a[pos]
		}
	}

	return a
}

func main() {
	input := []int{38, 27, 43, 3, 9, 82, 10, 55}
	fmt.Println(cycleSort(input))
	// [3 9 10 27 38 43 55 82]
}`,

    rust: `fn cycle_sort(arr: &[i32]) -> Vec<i32> {
    let mut a = arr.to_vec();
    let n = a.len();

    for cs in 0..n.saturating_sub(1) {
        let mut item = a[cs];

        // Find the correct position for item
        let mut pos = cs;
        for i in (cs + 1)..n {
            if a[i] < item {
                pos += 1;
            }
        }

        if pos == cs {
            continue; // already in place
        }

        // Skip duplicates at destination
        while a[pos] == item {
            pos += 1;
        }

        // Place item and rotate the cycle
        std::mem::swap(&mut a[pos], &mut item);

        while pos != cs {
            pos = cs;
            for i in (cs + 1)..n {
                if a[i] < item {
                    pos += 1;
                }
            }
            while a[pos] == item {
                pos += 1;
            }
            std::mem::swap(&mut a[pos], &mut item);
        }
    }

    a
}

fn main() {
    let input = [38, 27, 43, 3, 9, 82, 10, 55];
    println!("{:?}", cycle_sort(&input));
    // [3, 9, 10, 27, 38, 43, 55, 82]
}`,
  },
};
