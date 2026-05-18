import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ── Local state type ─────────────────────────────────────────────────────────
interface DPTableState {
  rowLabels: string[];
  colLabels: string[];
  table: (number | null)[][];
  current: [number, number] | null;
  comparing: [number, number][];
  result: number | null;
  phase: string;
}

// ── Input ────────────────────────────────────────────────────────────────────
interface KnapsackInput {
  weights: number[];
  values: number[];
  capacity: number;
}

const DEFAULT_KNAPSACK_INPUT: KnapsackInput = {
  weights: [2, 3, 4, 5],
  values: [3, 4, 5, 6],
  capacity: 8,
};

// ── Step generator ───────────────────────────────────────────────────────────
function generateSteps(
  input: KnapsackInput
): AlgorithmStep<DPTableState>[] {
  const { weights, values, capacity } = input;
  const n = weights.length;
  const W = capacity;
  const steps: AlgorithmStep<DPTableState>[] = [];

  // Build labels
  const rowLabels = [
    "",
    ...weights.map((w, i) => `item${i + 1}(w=${w},v=${values[i]})`),
  ];
  const colLabels = Array.from({ length: W + 1 }, (_, j) => String(j));

  // Initialise table with nulls
  const table: (number | null)[][] = Array.from({ length: n + 1 }, () =>
    Array(W + 1).fill(null)
  );

  const snap = (
    description: string,
    current: [number, number] | null,
    comparing: [number, number][],
    result: number | null,
    phase: string
  ): AlgorithmStep<DPTableState> => ({
    description,
    state: {
      rowLabels,
      colLabels,
      table: table.map((row) => [...row]),
      current,
      comparing,
      result,
      phase,
    },
    highlights: {},
    variables: result !== null ? { maxValue: result } : {},
  });

  // Initial state
  steps.push(
    snap(
      "Initialise the DP table. Rows represent items (0 = no items). Columns represent capacity from 0 to W.",
      null,
      [],
      null,
      "init"
    )
  );

  // Fill row 0 with zeros (no items available → value is always 0)
  for (let j = 0; j <= W; j++) {
    table[0][j] = 0;
  }
  steps.push(
    snap(
      "Base case: row 0 is all zeros — with no items available the maximum value is 0 for every capacity.",
      null,
      [],
      null,
      "base-row"
    )
  );

  // Fill DP table
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j <= W; j++) {
      if (weights[i - 1] > j) {
        // Can't include this item — carry forward value without it
        table[i][j] = table[i - 1][j] as number;
        steps.push(
          snap(
            `Item ${i} (w=${weights[i - 1]}) > capacity ${j}. Can't include — dp[${i}][${j}] = dp[${i - 1}][${j}] = ${table[i][j]}.`,
            [i, j],
            [[i - 1, j]],
            null,
            "fill"
          )
        );
      } else {
        // Choose the better of: skip item vs include item
        const skipVal = table[i - 1][j] as number;
        const includeVal =
          values[i - 1] + (table[i - 1][j - weights[i - 1]] as number);
        const val = Math.max(skipVal, includeVal);
        table[i][j] = val;
        steps.push(
          snap(
            `Include or skip item ${i}? max(skip=${skipVal}, take=${values[i - 1]}+dp[${i - 1}][${j - weights[i - 1]}]=${includeVal}) = ${val}. dp[${i}][${j}] = ${val}.`,
            [i, j],
            [
              [i - 1, j],
              [i - 1, j - weights[i - 1]],
            ],
            null,
            "fill"
          )
        );
      }
    }
  }

  // Final step
  const result = table[n][W] as number;
  steps.push(
    snap(
      `Optimal value = ${result}. dp[${n}][${W}] holds the maximum value achievable within capacity ${W}.`,
      [n, W],
      [],
      result,
      "done"
    )
  );

  return steps;
}

// ── Export ───────────────────────────────────────────────────────────────────
export const knapsack: AlgorithmDefinition<KnapsackInput, DPTableState> = {
  slug: "knapsack",
  name: "0/1 Knapsack",
  category: "dynamic-programming",
  difficulty: "intermediate",
  tags: ["dp", "2d-table", "combinatorial", "optimization"],
  summary:
    "Maximise the total value of items that fit in a knapsack of fixed capacity using a 2-D DP table.",

  description: `The 0/1 Knapsack problem asks: given n items each with a weight and a value, and a knapsack with maximum capacity W, choose a subset of items (each used at most once) that maximises total value without exceeding total weight.

The algorithm builds an (n+1) × (W+1) table where dp[i][j] stores the maximum value achievable using the first i items with a capacity of j.

**Recurrence:**
- If weights[i-1] > j: dp[i][j] = dp[i-1][j]  (item is too heavy — skip it)
- Otherwise:           dp[i][j] = max(dp[i-1][j], values[i-1] + dp[i-1][j − weights[i-1]])  (skip or take)

**Base case:** dp[0][j] = 0 — no items means zero value.

The answer sits at dp[n][W]. To recover which items were selected, backtrack through the table: if dp[i][j] ≠ dp[i-1][j] then item i was included.

The "0/1" refers to the binary choice — each item is either taken (1) or left (0). The unbounded variant allows taking each item multiple times.`,

  realWorldUsage: [
    {
      system: "Cloud computing — resource scheduler (AWS Batch, GKE)",
      useCase: "Packing workloads onto available VM instances",
      why: "Schedulers model each pending job as an item with a CPU/memory weight and a priority-based value, and each worker node as a knapsack with finite capacity. A 0/1 knapsack solve (or LP relaxation for large n) maximises throughput while respecting per-node resource limits.",
    },
    {
      system: "Quantitative finance — portfolio construction",
      useCase: "Selecting assets under budget or position-size constraints",
      why: "Portfolio optimisers can model each asset as an item whose weight is its capital requirement and whose value is its risk-adjusted expected return. Knapsack DP finds the allocation that maximises expected return without exceeding capital or regulatory exposure limits.",
    },
    {
      system: "Logistics — cargo loading optimisation",
      useCase: "Maximising revenue-per-flight for air freight or shipping containers",
      why: "Airlines and freight companies must select which shipments to load given strict weight and volume limits. A knapsack formulation — with shipment revenue as value and shipment weight as weight — directly models this decision, and is used as a sub-problem in column-generation algorithms for larger fleet-scheduling problems.",
    },
  ],

  complexity: {
    time: { best: "O(nW)", average: "O(nW)", worst: "O(nW)" },
    space: "O(nW)",
  },

  related: ["coin-change", "lcs"],
  implemented: true,
  defaultInput: DEFAULT_KNAPSACK_INPUT,
  generateSteps,

  code: {
    typescript: `function knapsack(
  weights: number[],
  values: number[],
  capacity: number
): number {
  const n = weights.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(capacity + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    for (let j = 0; j <= capacity; j++) {
      if (weights[i - 1] > j) {
        dp[i][j] = dp[i - 1][j];
      } else {
        dp[i][j] = Math.max(
          dp[i - 1][j],
          values[i - 1] + dp[i - 1][j - weights[i - 1]]
        );
      }
    }
  }

  return dp[n][capacity];
}

// Usage
console.log(knapsack([2, 3, 4, 5], [3, 4, 5, 6], 8)); // 10`,

    go: `package main

import "fmt"

func knapsack(weights, values []int, capacity int) int {
	n := len(weights)
	dp := make([][]int, n+1)
	for i := range dp {
		dp[i] = make([]int, capacity+1)
	}

	for i := 1; i <= n; i++ {
		for j := 0; j <= capacity; j++ {
			dp[i][j] = dp[i-1][j]
			if weights[i-1] <= j {
				take := values[i-1] + dp[i-1][j-weights[i-1]]
				if take > dp[i][j] {
					dp[i][j] = take
				}
			}
		}
	}

	return dp[n][capacity]
}

func main() {
	weights := []int{2, 3, 4, 5}
	values := []int{3, 4, 5, 6}
	fmt.Println(knapsack(weights, values, 8)) // 10
}`,

    rust: `fn knapsack(weights: &[usize], values: &[usize], capacity: usize) -> usize {
    let n = weights.len();
    let mut dp = vec![vec![0usize; capacity + 1]; n + 1];

    for i in 1..=n {
        for j in 0..=capacity {
            dp[i][j] = dp[i - 1][j];
            if weights[i - 1] <= j {
                let take = values[i - 1] + dp[i - 1][j - weights[i - 1]];
                if take > dp[i][j] {
                    dp[i][j] = take;
                }
            }
        }
    }

    dp[n][capacity]
}

fn main() {
    let weights = [2, 3, 4, 5];
    let values  = [3, 4, 5, 6];
    println!("{}", knapsack(&weights, &values, 8)); // 10
}`,
  },
};
