import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface FibDPState {
  n: number;
  table: (number | null)[];
  current: number | null;
  dep1: number | null;
  dep2: number | null;
}

type FibDPInput = { n: number };

function generateSteps(input: FibDPInput): AlgorithmStep<FibDPState>[] {
  const { n } = input;
  const steps: AlgorithmStep<FibDPState>[] = [];
  const table: (number | null)[] = Array(n + 1).fill(null);

  // Initial step
  steps.push({
    description: `Initialize DP table for F(0) through F(${n}). All values unknown.`,
    state: { n, table: [...table], current: null, dep1: null, dep2: null },
    highlights: {},
    variables: { n, tableSize: n + 1 },
  });

  // Base case F(0)
  table[0] = 0;
  steps.push({
    description: `Base case: F(0) = 0.`,
    state: { n, table: [...table], current: 0, dep1: null, dep2: null },
    highlights: { table_0: "found" },
    variables: { index: 0, value: 0 },
  });

  if (n >= 1) {
    // Base case F(1)
    table[1] = 1;
    steps.push({
      description: `Base case: F(1) = 1.`,
      state: { n, table: [...table], current: 1, dep1: null, dep2: null },
      highlights: { table_0: "sorted", table_1: "found" },
      variables: { index: 1, value: 1 },
    });
  }

  // Fill table bottom-up
  for (let i = 2; i <= n; i++) {
    const a = table[i - 1] as number;
    const b = table[i - 2] as number;
    table[i] = a + b;

    steps.push({
      description: `F(${i}) = F(${i - 1}) + F(${i - 2}) = ${a} + ${b} = ${table[i]}.`,
      state: { n, table: [...table], current: i, dep1: i - 1, dep2: i - 2 },
      highlights: {
        [`table_${i}`]: "active",
        [`table_${i - 1}`]: "compare",
        [`table_${i - 2}`]: "compare",
      },
      variables: {
        i,
        [`F(${i - 1})`]: a,
        [`F(${i - 2})`]: b,
        [`F(${i})`]: table[i] as number,
      },
    });
  }

  // Final step
  const result = table[n] as number;
  steps.push({
    description: `Complete! F(${n}) = ${result}. Solved in O(n) vs naive O(2^n) recursive.`,
    state: { n, table: [...table], current: null, dep1: null, dep2: null },
    highlights: Object.fromEntries(
      Array.from({ length: n + 1 }, (_, i) => [
        `table_${i}`,
        "sorted" as const,
      ])
    ),
    variables: { result, n, naiveOps: `~2^${n}`, dpOps: n },
  });

  return steps;
}

export const fibonacciDP: AlgorithmDefinition<FibDPInput, FibDPState> = {
  slug: "fibonacci-dp",
  name: "Fibonacci (Dynamic Programming)",
  category: "dynamic-programming",
  difficulty: "beginner",
  tags: ["dp", "memoization", "tabulation", "bottom-up"],
  summary:
    "Compute the nth Fibonacci number in O(n) by building a table of subproblem results instead of recomputing them recursively.",

  description: `The Fibonacci sequence is the canonical introduction to Dynamic Programming because it exhibits both hallmarks of DP problems: **optimal substructure** (F(n) depends only on F(n-1) and F(n-2)) and **overlapping subproblems** (a naive recursive solution recomputes the same values exponentially many times — F(5) alone spawns 15 recursive calls). The DP approach eliminates this redundancy by solving each subproblem exactly once and storing the result.

This implementation uses the **bottom-up tabulation** style: it fills an array from F(0) upward, so every value needed for the next computation is already available. This avoids call-stack overhead entirely and makes memory access patterns cache-friendly. The result is O(n) time and O(n) space. A further optimization — the space-optimized variant — reduces memory to O(1) by keeping only the last two values, though it sacrifices the ability to answer arbitrary F(k) queries for k ≤ n in O(1).

Fibonacci DP is important beyond the sequence itself because it teaches the memoization pattern underpinning React's useMemo, HTTP response caches, LRU caches, and memoized selectors in Redux. It is also the foundation of more complex DP problems: Coin Change, Climbing Stairs, and many others reduce directly to Fibonacci-style recurrences once the state space is defined.`,

  realWorldUsage: [
    {
      system: "React / frontend frameworks",
      useCase: "useMemo and React.memo cache expensive derived values",
      why: "React's memoization hooks apply exactly the DP insight: if the inputs haven't changed, return the cached result instead of recomputing. The underlying mechanism is a lookup table keyed on dependency values — a direct application of the tabulation pattern.",
    },
    {
      system: "Financial modeling systems",
      useCase: "Fibonacci retracement levels in technical analysis tools",
      why: "Trading platforms precompute Fibonacci ratios (23.6%, 38.2%, 61.8%, 100%) from key price levels. Storing intermediate Fibonacci values in a lookup table lets analysts recompute price targets in O(1) as support/resistance levels shift — critical for real-time charting.",
    },
    {
      system: "Fibonacci heap data structure",
      useCase: "Amortized O(log n) decrease-key in Dijkstra's algorithm",
      why: "The Fibonacci heap is named after the Fibonacci numbers because the sizes of its trees after consolidation follow the Fibonacci sequence. Understanding the DP properties of the sequence is essential for analyzing why decrease-key runs in O(1) amortized time.",
    },
  ],

  complexity: {
    time: { best: "O(n)", average: "O(n)", worst: "O(n)" },
    space: "O(n)",
  },

  related: ["knapsack", "coin-change", "lcs"],
  implemented: true,
  defaultInput: { n: 10 },
  generateSteps,

  code: {
    typescript: `function fibonacciDP(n: number): number {
  if (n <= 1) return n;

  const table = new Array<number>(n + 1);
  table[0] = 0;
  table[1] = 1;

  for (let i = 2; i <= n; i++) {
    table[i] = table[i - 1] + table[i - 2];
  }

  return table[n];
}

// Space-optimized O(1) variant
function fibonacciO1(n: number): number {
  if (n <= 1) return n;
  let [prev2, prev1] = [0, 1];
  for (let i = 2; i <= n; i++) {
    [prev2, prev1] = [prev1, prev2 + prev1];
  }
  return prev1;
}

console.log(fibonacciDP(10)); // 55
console.log(fibonacciO1(10)); // 55`,

    go: `package main

import "fmt"

func fibonacciDP(n int) int {
	if n <= 1 {
		return n
	}

	table := make([]int, n+1)
	table[0], table[1] = 0, 1

	for i := 2; i <= n; i++ {
		table[i] = table[i-1] + table[i-2]
	}

	return table[n]
}

// Space-optimized O(1) variant
func fibonacciO1(n int) int {
	if n <= 1 {
		return n
	}
	prev2, prev1 := 0, 1
	for i := 2; i <= n; i++ {
		prev2, prev1 = prev1, prev2+prev1
	}
	return prev1
}

func main() {
	fmt.Println(fibonacciDP(10)) // 55
	fmt.Println(fibonacciO1(10)) // 55
}`,

    rust: `fn fibonacci_dp(n: usize) -> u64 {
    if n <= 1 {
        return n as u64;
    }

    let mut table = vec![0u64; n + 1];
    table[1] = 1;

    for i in 2..=n {
        table[i] = table[i - 1] + table[i - 2];
    }

    table[n]
}

// Space-optimized O(1) variant
fn fibonacci_o1(n: usize) -> u64 {
    if n <= 1 {
        return n as u64;
    }
    let (mut prev2, mut prev1) = (0u64, 1u64);
    for _ in 2..=n {
        (prev2, prev1) = (prev1, prev2 + prev1);
    }
    prev1
}

fn main() {
    println!("{}", fibonacci_dp(10)); // 55
    println!("{}", fibonacci_o1(10)); // 55
}`,
  },
};
