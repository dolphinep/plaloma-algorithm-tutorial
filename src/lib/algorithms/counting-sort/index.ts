import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface CountingSortState {
  input: number[];
  countArray: number[];
  output: (number | null)[];
  phase: "counting" | "accumulating" | "placing" | "done";
  activeInput: number | null;
  activeCount: number | null;
  activeOutput: number | null;
}

type CountingSortInput = { array: number[] };

function generateSteps(
  input: CountingSortInput
): AlgorithmStep<CountingSortState>[] {
  const { array } = input;
  const steps: AlgorithmStep<CountingSortState>[] = [];

  const arr = [...array];
  const n = arr.length;
  const max = Math.max(...arr);
  const count = Array(max + 1).fill(0);
  const output: (number | null)[] = Array(n).fill(null);

  // Initial step
  steps.push({
    description: `Initialize count array of size ${max + 1} (0–${max}), all zeros.`,
    state: {
      input: [...arr],
      countArray: [...count],
      output: [...output],
      phase: "counting",
      activeInput: null,
      activeCount: null,
      activeOutput: null,
    },
    highlights: {},
    variables: { max, countArraySize: max + 1 },
  });

  // Phase: counting
  for (let i = 0; i < n; i++) {
    const val = arr[i];
    count[val]++;
    steps.push({
      description: `Count occurrence of ${val}: count[${val}] → ${count[val]}.`,
      state: {
        input: [...arr],
        countArray: [...count],
        output: [...output],
        phase: "counting",
        activeInput: i,
        activeCount: val,
        activeOutput: null,
      },
      highlights: { [`input_${i}`]: "active", [`count_${val}`]: "compare" },
      variables: { index: i, value: val, newCount: count[val] },
    });
  }

  // Phase: accumulating
  for (let i = 1; i <= max; i++) {
    const prev = count[i - 1];
    count[i] += prev;
    steps.push({
      description: `Prefix sum: count[${i}] = count[${i}] + count[${i - 1}] = ${count[i]}.`,
      state: {
        input: [...arr],
        countArray: [...count],
        output: [...output],
        phase: "accumulating",
        activeInput: null,
        activeCount: i,
        activeOutput: null,
      },
      highlights: {
        [`count_${i}`]: "active",
        [`count_${i - 1}`]: "compare",
      },
      variables: { i, "count[i-1]": prev, newVal: count[i] },
    });
  }

  // Phase: placing (right-to-left for stability)
  for (let i = n - 1; i >= 0; i--) {
    const val = arr[i];
    const pos = --count[val];
    output[pos] = val;
    steps.push({
      description: `Place ${val} at position ${pos}.`,
      state: {
        input: [...arr],
        countArray: [...count],
        output: [...output],
        phase: "placing",
        activeInput: i,
        activeCount: val,
        activeOutput: pos,
      },
      highlights: {
        [`input_${i}`]: "active",
        [`output_${pos}`]: "found",
        [`count_${val}`]: "compare",
      },
      variables: { inputIndex: i, value: val, outputPosition: pos },
    });
  }

  // Phase: done
  const sorted = output as number[];
  steps.push({
    description: `Sorting complete. Result: [${sorted.join(", ")}].`,
    state: {
      input: sorted,
      countArray: [...count],
      output: [...output],
      phase: "done",
      activeInput: null,
      activeCount: null,
      activeOutput: null,
    },
    highlights: Object.fromEntries(
      sorted.map((_, i) => [`input_${i}`, "sorted" as const])
    ),
    variables: { result: sorted.join(", ") },
  });

  return steps;
}

export const countingSort: AlgorithmDefinition<
  CountingSortInput,
  CountingSortState
> = {
  slug: "counting-sort",
  name: "Counting Sort",
  category: "sorting",
  difficulty: "intermediate",
  tags: ["non-comparison", "stable", "integer-sort", "linear"],
  summary:
    "Sort integers in linear time by counting occurrences and reconstructing the sorted output.",

  description: `Counting Sort achieves O(n + k) time complexity — faster than any comparison-based sort — by exploiting the fact that the input values are bounded integers in a known range [0, k]. Instead of comparing elements against each other, it tallies how many times each distinct value appears in a count array, then uses a prefix-sum pass to convert those counts into correct sorted positions.

The algorithm runs in three clean phases. First, it iterates the input and increments count[value] for each element. Second, it converts the count array into a cumulative prefix sum so that count[v] now holds the number of elements ≤ v, which equals the last valid output index for value v. Third, it scans the input right-to-left and places each element at count[value]-1, decrementing the counter afterwards — this right-to-left traversal is what makes the sort stable.

Counting Sort is **not in-place** (it requires O(k) auxiliary space for the count array and O(n) for the output buffer) and is only practical when the key range k is comparable in size to n. For wide integer domains like 32-bit values, Radix Sort is preferred because it applies counting sort digit-by-digit on a much smaller k.`,

  realWorldUsage: [
    {
      system: "Network packet schedulers",
      useCase: "Sorting packets by priority class (0–63)",
      why: "Priority values are small bounded integers. Counting sort empties the O(k) priority buckets in O(n + k) time without any per-packet comparisons, giving deterministic low-latency scheduling on hardware with fixed queue depths.",
    },
    {
      system: "Bioinformatics / DNA analysis",
      useCase: "Counting and sorting character frequencies in DNA sequences",
      why: "DNA alphabets are tiny (A, C, G, T — only 4 symbols). Counting sort processes gigabyte-scale sequences in a single linear pass, orders of magnitude faster than comparison sorts for tasks like k-mer frequency tables.",
    },
    {
      system: "Census and demographic data processing",
      useCase: "Age-based sorting for population statistics",
      why: "Human ages span a bounded range (0–120). Sorting hundreds of millions of records by age in O(n) is practical with counting sort, and the stability guarantee preserves original record order within the same age cohort — important for reproducible statistical outputs.",
    },
  ],

  complexity: {
    time: { best: "O(n+k)", average: "O(n+k)", worst: "O(n+k)" },
    space: "O(k)",
    stable: true,
    inPlace: false,
  },

  related: ["radix-sort", "bucket-sort"],
  implemented: true,
  defaultInput: { array: [4, 2, 2, 8, 3, 3, 1] },
  generateSteps,

  code: {
    typescript: `function countingSort(arr: number[]): number[] {
  const max = Math.max(...arr);
  const count = new Array<number>(max + 1).fill(0);
  const output = new Array<number>(arr.length);

  // Phase 1: tally occurrences
  for (const val of arr) {
    count[val]++;
  }

  // Phase 2: prefix sum → sorted positions
  for (let i = 1; i <= max; i++) {
    count[i] += count[i - 1];
  }

  // Phase 3: place elements right-to-left (stable)
  for (let i = arr.length - 1; i >= 0; i--) {
    output[--count[arr[i]]] = arr[i];
  }

  return output;
}

// Usage
console.log(countingSort([4, 2, 2, 8, 3, 3, 1]));
// [1, 2, 2, 3, 3, 4, 8]`,

    go: `package main

import "fmt"

func countingSort(arr []int) []int {
	if len(arr) == 0 {
		return arr
	}

	max := arr[0]
	for _, v := range arr {
		if v > max {
			max = v
		}
	}

	count := make([]int, max+1)
	output := make([]int, len(arr))

	// Phase 1: tally occurrences
	for _, v := range arr {
		count[v]++
	}

	// Phase 2: prefix sum → sorted positions
	for i := 1; i <= max; i++ {
		count[i] += count[i-1]
	}

	// Phase 3: place elements right-to-left (stable)
	for i := len(arr) - 1; i >= 0; i-- {
		count[arr[i]]--
		output[count[arr[i]]] = arr[i]
	}

	return output
}

func main() {
	fmt.Println(countingSort([]int{4, 2, 2, 8, 3, 3, 1}))
	// [1 2 2 3 3 4 8]
}`,

    rust: `fn counting_sort(arr: &[usize]) -> Vec<usize> {
    if arr.is_empty() {
        return vec![];
    }

    let max = *arr.iter().max().unwrap();
    let mut count = vec![0usize; max + 1];
    let mut output = vec![0usize; arr.len()];

    // Phase 1: tally occurrences
    for &val in arr {
        count[val] += 1;
    }

    // Phase 2: prefix sum → sorted positions
    for i in 1..=max {
        count[i] += count[i - 1];
    }

    // Phase 3: place elements right-to-left (stable)
    for &val in arr.iter().rev() {
        count[val] -= 1;
        output[count[val]] = val;
    }

    output
}

fn main() {
    let input = [4, 2, 2, 8, 3, 3, 1];
    println!("{:?}", counting_sort(&input));
    // [1, 2, 2, 3, 3, 4, 8]
}`,
  },
};
