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

  const max = Math.max(...arr);

  const initial: BarState[] = Array(n).fill("default");
  steps.push(
    snap(arr, initial, comparisons, swaps, `Starting Radix Sort (LSD). Max value = ${max}; will process ${Math.floor(Math.log10(max)) + 1} digit place(s).`)
  );

  const digitPlaceNames = ["ones", "tens", "hundreds", "thousands", "ten-thousands"];

  let pass = 0;
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    pass++;
    const placeName = digitPlaceNames[pass - 1] ?? `10^${pass - 1}`;

    // Announce the digit pass
    const announceStates: BarState[] = Array(n).fill("default");
    steps.push(
      snap(arr, announceStates, comparisons, swaps, `Digit pass ${pass}: sorting by the ${placeName} digit.`, pass, { pass, digitPlace: exp })
    );

    // Distribute into buckets, showing each element being read
    const buckets: number[][] = Array.from({ length: 10 }, () => []);

    for (let i = 0; i < n; i++) {
      const digit = Math.floor(arr[i] / exp) % 10;
      const readStates: BarState[] = Array(n).fill("default");
      readStates[i] = "active";
      comparisons++;
      steps.push(
        snap(arr, readStates, comparisons, swaps, `Reading arr[${i}]=${arr[i]}, digit=${digit} → bucket ${digit}.`, pass, { pass, index: i, value: arr[i], digit, bucket: digit })
      );
      buckets[digit].push(arr[i]);
    }

    // Reconstruct array from buckets
    let idx = 0;
    for (let b = 0; b < 10; b++) {
      for (const val of buckets[b]) {
        arr[idx++] = val;
        swaps++;
      }
    }

    const reconstructedStates: BarState[] = Array(n).fill("range");
    steps.push(
      snap(arr, reconstructedStates, comparisons, swaps, `Reconstructing array from buckets after pass ${pass}.`, pass, { pass })
    );
  }

  steps.push(
    snap(arr, allSorted(n), comparisons, swaps, "Array is fully sorted.")
  );

  return steps;
}

export const radixSort: AlgorithmDefinition<SortingInput, SortingState> = {
  slug: "radix-sort",
  name: "Radix Sort",
  category: "sorting",
  difficulty: "intermediate",
  tags: ["non-comparison", "stable", "linear", "integer-sort", "lsd"],
  summary: "Sort non-negative integers digit by digit from least significant to most significant using counting sort as a subroutine.",

  description: `Radix Sort is a non-comparison-based sorting algorithm that processes integers one digit at a time, from the least significant digit (LSD) to the most significant. On each pass it distributes elements into ten buckets (0–9) based on the current digit, then concatenates the buckets back into the array while preserving order. Because each pass is stable, the full sort produces a correctly ordered result after processing all k digit places.

The algorithm runs in O(nk) time where k is the number of digits in the largest value, which is effectively O(n) when k is bounded by a constant (e.g. 32-bit integers). Unlike comparison-based sorts, Radix Sort never directly compares elements against each other, which allows it to sidestep the Ω(n log n) lower bound that governs comparison algorithms. This makes it particularly attractive for sorting large collections of fixed-width integers.

Radix Sort is **stable** — elements with equal digit values at any pass maintain their relative order, which is essential for correctness across multiple passes. It is **not in-place**, requiring O(n + k) auxiliary space for the bucket arrays. In practice the constant factors are small and cache performance is reasonable for large integer datasets.`,

  realWorldUsage: [
    {
      system: "Database index builders",
      useCase: "Sorting large integer IDs with fixed digit counts in linear time",
      why: "Primary key columns are often 32- or 64-bit integers with a bounded digit count. Radix sort processes millions of row IDs in O(nk) without comparisons, making bulk index construction and re-indexing operations significantly faster than comparison-based alternatives.",
    },
    {
      system: "Network routers — IP address sorting",
      useCase: "Sorting IPv4 addresses by octet",
      why: "IPv4 addresses are 32-bit integers naturally decomposed into four 8-bit octets. Radix sort's digit-by-digit passes map directly onto the octet structure, enabling routing tables with millions of entries to be sorted in linear time for longest-prefix-match lookups.",
    },
    {
      system: "Suffix array construction",
      useCase: "Used in DC3/Skew algorithm steps for string processing",
      why: "The DC3/Skew algorithm for building suffix arrays applies radix sort at multiple stages to sort triples of characters in linear time. This is fundamental to efficient full-text indices, bioinformatics sequence alignment tools, and data compression (BWT/LZ-family).",
    },
  ],

  complexity: {
    time: { best: "O(nk)", average: "O(nk)", worst: "O(nk)" },
    space: "O(n+k)",
    stable: true,
    inPlace: false,
  },

  related: ["counting-sort", "bucket-sort"],
  implemented: true,
  defaultInput: DEFAULT_SORT_INPUT,
  generateSteps,

  code: {
    typescript: `function radixSort(arr: number[]): number[] {
  const a = [...arr];
  const max = Math.max(...a);

  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const buckets: number[][] = Array.from({ length: 10 }, () => []);

    for (const val of a) {
      buckets[Math.floor(val / exp) % 10].push(val);
    }

    let idx = 0;
    for (const bucket of buckets) {
      for (const val of bucket) {
        a[idx++] = val;
      }
    }
  }

  return a;
}

// Usage
console.log(radixSort([38, 27, 43, 3, 9, 82, 10, 55]));
// [3, 9, 10, 27, 38, 43, 55, 82]`,

    go: `package main

import "fmt"

func radixSort(arr []int) []int {
	a := make([]int, len(arr))
	copy(a, arr)

	max := a[0]
	for _, v := range a {
		if v > max {
			max = v
		}
	}

	for exp := 1; max/exp > 0; exp *= 10 {
		buckets := make([][]int, 10)
		for i := range buckets {
			buckets[i] = []int{}
		}

		for _, val := range a {
			digit := (val / exp) % 10
			buckets[digit] = append(buckets[digit], val)
		}

		idx := 0
		for _, bucket := range buckets {
			for _, val := range bucket {
				a[idx] = val
				idx++
			}
		}
	}

	return a
}

func main() {
	input := []int{38, 27, 43, 3, 9, 82, 10, 55}
	fmt.Println(radixSort(input))
	// [3 9 10 27 38 43 55 82]
}`,

    rust: `fn radix_sort(arr: &[u32]) -> Vec<u32> {
    let mut a = arr.to_vec();
    if a.is_empty() {
        return a;
    }

    let max = *a.iter().max().unwrap();
    let mut exp = 1u32;

    while max / exp > 0 {
        let mut buckets: Vec<Vec<u32>> = vec![vec![]; 10];

        for &val in &a {
            buckets[((val / exp) % 10) as usize].push(val);
        }

        let mut idx = 0;
        for bucket in &buckets {
            for &val in bucket {
                a[idx] = val;
                idx += 1;
            }
        }

        exp = match exp.checked_mul(10) {
            Some(v) => v,
            None => break,
        };
    }

    a
}

fn main() {
    let input = [38u32, 27, 43, 3, 9, 82, 10, 55];
    println!("{:?}", radix_sort(&input));
    // [3, 9, 10, 27, 38, 43, 55, 82]
}`,
  },
};
