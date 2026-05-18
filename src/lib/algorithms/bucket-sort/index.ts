import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";
import {
  SortingInput,
  SortingState,
  BarState,
  snap,
  allSorted,
} from "../sorting-utils";

const DEFAULT_BUCKET_INPUT: SortingInput = {
  array: [29, 25, 3, 49, 9, 37, 21, 43],
};

function generateSteps(
  input: SortingInput
): AlgorithmStep<SortingState>[] {
  const arr = [...input.array];
  const n = arr.length;
  const steps: AlgorithmStep<SortingState>[] = [];
  let comparisons = 0;
  let swaps = 0;

  const max = Math.max(...arr);
  const nBuckets = n;

  // Step 1: announce bucket creation
  const initial: BarState[] = Array(n).fill("default");
  steps.push(
    snap(arr, initial, comparisons, swaps, `Create ${nBuckets} buckets for range [0, ${max}].`, undefined, { nBuckets, max })
  );

  // Step 2: distribute elements into buckets
  const buckets: number[][] = Array.from({ length: nBuckets }, () => []);

  for (let i = 0; i < n; i++) {
    const b = Math.min(Math.floor((arr[i] / (max + 1)) * nBuckets), nBuckets - 1);
    const distStates: BarState[] = Array(n).fill("default");
    distStates[i] = "active";
    comparisons++;
    steps.push(
      snap(arr, distStates, comparisons, swaps, `arr[${i}]=${arr[i]} → bucket ${b}.`, undefined, { index: i, value: arr[i], bucket: b })
    );
    buckets[b].push(arr[i]);
  }

  // Step 3: all distributed — show range state
  const distributedStates: BarState[] = Array(n).fill("range");
  steps.push(
    snap(arr, distributedStates, comparisons, swaps, "Elements distributed into buckets.", undefined, { nBuckets })
  );

  // Step 4: sort each bucket with insertion sort (in-place on bucket arrays)
  for (let b = 0; b < nBuckets; b++) {
    const bucket = buckets[b];
    if (bucket.length <= 1) continue;

    for (let i = 1; i < bucket.length; i++) {
      const key = bucket[i];
      let j = i - 1;

      while (j >= 0 && bucket[j] > key) {
        // Find the positions in arr to highlight
        // Reconstruct current arr state to show comparisons
        let idx = 0;
        for (let bb = 0; bb < nBuckets; bb++) {
          for (let k = 0; k < buckets[bb].length; k++) {
            arr[idx++] = buckets[bb][k];
          }
        }

        const bucketStates: BarState[] = Array(n).fill("default");
        // Approximate bucket element positions in output array
        let startIdx = 0;
        for (let bb = 0; bb < b; bb++) startIdx += buckets[bb].length;

        if (startIdx + j < n) bucketStates[startIdx + j] = "comparing";
        if (startIdx + j + 1 < n) bucketStates[startIdx + j + 1] = "comparing";

        comparisons++;
        steps.push(
          snap(arr, bucketStates, comparisons, swaps, `Bucket ${b}: Compare ${bucket[j]} and ${bucket[j + 1] ?? key}.`, undefined, { bucket: b, comparing: `${bucket[j]} vs ${key}` })
        );

        bucket[j + 1] = bucket[j];
        swaps++;
        j--;
      }

      bucket[j + 1] = key;

      // Show swap state
      let idx = 0;
      for (let bb = 0; bb < nBuckets; bb++) {
        for (let k = 0; k < buckets[bb].length; k++) {
          arr[idx++] = buckets[bb][k];
        }
      }

      let startIdx = 0;
      for (let bb = 0; bb < b; bb++) startIdx += buckets[bb].length;

      const afterSwapStates: BarState[] = Array(n).fill("default");
      for (let k = startIdx; k < startIdx + bucket.length && k < n; k++) {
        afterSwapStates[k] = "swapping";
      }
      steps.push(
        snap(arr, afterSwapStates, comparisons, swaps, `Bucket ${b}: placed ${key} at position ${j + 1} within bucket.`, undefined, { bucket: b })
      );
    }
  }

  // Step 5: concatenate buckets
  let idx = 0;
  for (let b = 0; b < nBuckets; b++) {
    for (const val of buckets[b]) {
      arr[idx++] = val;
    }
  }

  const concatStates: BarState[] = Array(n).fill("range");
  steps.push(
    snap(arr, concatStates, comparisons, swaps, "Concatenating all buckets.", undefined, { nBuckets })
  );

  steps.push(
    snap(arr, allSorted(n), comparisons, swaps, "Array is fully sorted.")
  );

  return steps;
}

export const bucketSort: AlgorithmDefinition<SortingInput, SortingState> = {
  slug: "bucket-sort",
  name: "Bucket Sort",
  category: "sorting",
  difficulty: "intermediate",
  tags: ["non-comparison", "stable", "distribution", "linear"],
  summary: "Distribute elements into buckets, sort each bucket individually, then concatenate for a sorted result.",

  description: `Bucket Sort partitions the input into a fixed number of equally-sized buckets based on value ranges, sorts each bucket independently (typically with insertion sort), and then concatenates the buckets to form the sorted output. When the input values are uniformly distributed, each bucket holds approximately one element on average, making the expected total work O(n).

The algorithm achieves O(n + k) average-case performance where k is the number of buckets, but degrades to O(n²) in the worst case when all elements land in a single bucket. Choosing a bucket count equal to the input size and assuming uniform distribution gives the best theoretical performance. The actual speed is highly dependent on the distribution of the data — Bucket Sort shines on uniformly distributed floating-point values but performs poorly on clustered or adversarial inputs.

Bucket Sort is **stable** as long as the per-bucket sort is stable (insertion sort is). It is **not in-place** because it requires O(n + k) auxiliary space for the bucket arrays. Its primary advantage over comparison-based sorts is that for the right data distribution it runs in linear time, rivalling Counting Sort without the constraint of integer-only input.`,

  realWorldUsage: [
    {
      system: "Floating-point sorting in scientific computing",
      useCase: "Uniformly distributed floats sort in O(n)",
      why: "Monte Carlo simulations and physics engines often produce uniformly distributed floating-point outputs that must be sorted for statistical analysis or rendering. Bucket Sort's expected O(n) time on uniform data makes it dramatically faster than O(n log n) comparison sorts for these workloads.",
    },
    {
      system: "Histogram equalisation in image processing",
      useCase: "Pixel values distributed into intensity buckets",
      why: "Histogram equalisation maps each pixel's intensity to a target distribution. Bucket Sort naturally produces the frequency histogram as a by-product of distribution, and the sorted buckets directly yield the cumulative distribution function needed to compute the equalisation mapping.",
    },
    {
      system: "Geographic data partitioning",
      useCase: "GPS coordinates bucketed by latitude/longitude zones",
      why: "Geospatial databases partition coordinates into spatial grid cells (buckets) for efficient range queries and nearest-neighbour lookups. Bucket Sort's distribution step maps directly onto this partitioning, enabling bulk loading of spatial indices in linear time when coordinate values are uniformly distributed across the globe.",
    },
  ],

  complexity: {
    time: { best: "O(n+k)", average: "O(n+k)", worst: "O(n²)" },
    space: "O(n+k)",
    stable: true,
    inPlace: false,
  },

  related: ["counting-sort", "radix-sort"],
  implemented: true,
  defaultInput: DEFAULT_BUCKET_INPUT,
  generateSteps,

  code: {
    typescript: `function bucketSort(arr: number[]): number[] {
  const n = arr.length;
  if (n <= 1) return [...arr];

  const max = Math.max(...arr);
  const buckets: number[][] = Array.from({ length: n }, () => []);

  // Distribute
  for (const val of arr) {
    const b = Math.min(Math.floor((val / (max + 1)) * n), n - 1);
    buckets[b].push(val);
  }

  // Sort each bucket with insertion sort
  for (const bucket of buckets) {
    for (let i = 1; i < bucket.length; i++) {
      const key = bucket[i];
      let j = i - 1;
      while (j >= 0 && bucket[j] > key) {
        bucket[j + 1] = bucket[j];
        j--;
      }
      bucket[j + 1] = key;
    }
  }

  // Concatenate
  return ([] as number[]).concat(...buckets);
}

// Usage
console.log(bucketSort([29, 25, 3, 49, 9, 37, 21, 43]));
// [3, 9, 21, 25, 29, 37, 43, 49]`,

    go: `package main

import (
	"fmt"
	"sort"
)

func bucketSort(arr []int) []int {
	n := len(arr)
	if n <= 1 {
		result := make([]int, n)
		copy(result, arr)
		return result
	}

	max := arr[0]
	for _, v := range arr {
		if v > max {
			max = v
		}
	}

	buckets := make([][]int, n)
	for i := range buckets {
		buckets[i] = []int{}
	}

	// Distribute
	for _, val := range arr {
		b := (val * n) / (max + 1)
		if b >= n {
			b = n - 1
		}
		buckets[b] = append(buckets[b], val)
	}

	// Sort each bucket and concatenate
	result := make([]int, 0, n)
	for _, bucket := range buckets {
		sort.Ints(bucket)
		result = append(result, bucket...)
	}

	return result
}

func main() {
	input := []int{29, 25, 3, 49, 9, 37, 21, 43}
	fmt.Println(bucketSort(input))
	// [3 9 21 25 29 37 43 49]
}`,

    rust: `fn bucket_sort(arr: &[u32]) -> Vec<u32> {
    let n = arr.len();
    if n <= 1 {
        return arr.to_vec();
    }

    let max = *arr.iter().max().unwrap();
    let mut buckets: Vec<Vec<u32>> = vec![vec![]; n];

    // Distribute
    for &val in arr {
        let b = ((val as usize * n) / (max as usize + 1)).min(n - 1);
        buckets[b].push(val);
    }

    // Sort each bucket and concatenate
    let mut result = Vec::with_capacity(n);
    for mut bucket in buckets {
        bucket.sort_unstable();
        result.extend(bucket);
    }

    result
}

fn main() {
    let input = [29u32, 25, 3, 49, 9, 37, 21, 43];
    println!("{:?}", bucket_sort(&input));
    // [3, 9, 21, 25, 29, 37, 43, 49]
}`,
  },
};
