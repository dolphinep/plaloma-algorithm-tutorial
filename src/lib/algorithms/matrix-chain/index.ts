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
interface MatrixChainInput {
  dims: number[];
}

const DEFAULT_MATRIX_CHAIN_INPUT: MatrixChainInput = {
  dims: [30, 35, 15, 5, 10, 20, 25],
};

// ── Step generator ───────────────────────────────────────────────────────────
function generateSteps(
  input: MatrixChainInput
): AlgorithmStep<DPTableState>[] {
  const { dims } = input;
  const n = dims.length - 1; // number of matrices
  const steps: AlgorithmStep<DPTableState>[] = [];

  const rowLabels = ["", ...Array.from({ length: n }, (_, i) => String(i + 1))];
  const colLabels = [...rowLabels];

  // (n+1) × (n+1) table; row 0 and col 0 are unused (null)
  const table: (number | null)[][] = Array.from({ length: n + 1 }, () =>
    Array(n + 1).fill(null)
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
    variables: result !== null ? { minCost: result } : {},
  });

  // Initial snapshot
  steps.push(
    snap(
      `Matrix Chain Multiplication: find minimum scalar multiplications for ${n} matrices with dimension sequence [${dims.join(", ")}].`,
      null,
      [],
      null,
      "init"
    )
  );

  // Base case: dp[i][i] = 0 for all i
  for (let i = 1; i <= n; i++) {
    table[i][i] = 0;
  }
  steps.push(
    snap(
      "Base case: dp[i][i] = 0 for all i — multiplying a single matrix costs zero operations.",
      null,
      [],
      null,
      "base"
    )
  );

  // Fill by chain length l = 2 to n
  for (let l = 2; l <= n; l++) {
    for (let i = 1; i <= n - l + 1; i++) {
      const j = i + l - 1;
      let minCost = Infinity;

      steps.push(
        snap(
          `Computing dp[${i}][${j}] (chain length ${l}): trying all splits k = ${i} to ${j - 1}.`,
          [i, j],
          [],
          null,
          "fill"
        )
      );

      for (let k = i; k <= j - 1; k++) {
        const left = table[i][k] as number;
        const right = table[k + 1][j] as number;
        const cost = left + right + dims[i - 1] * dims[k] * dims[j];

        steps.push(
          snap(
            `dp[${i}][${j}]: try split k=${k}: ${left} + ${right} + ${dims[i - 1]}×${dims[k]}×${dims[j]} = ${cost}.`,
            [i, j],
            [
              [i, k],
              [k + 1, j],
            ],
            null,
            "fill"
          )
        );

        if (cost < minCost) {
          minCost = cost;
        }
      }

      table[i][j] = minCost;
      steps.push(
        snap(
          `dp[${i}][${j}] = ${minCost} (minimum over all splits).`,
          [i, j],
          [],
          null,
          "fill"
        )
      );
    }
  }

  // Final result
  const result = table[1][n] as number;
  steps.push(
    snap(
      `Done. dp[1][${n}] = ${result} — minimum scalar multiplications to compute the full matrix chain.`,
      [1, n],
      [],
      result,
      "done"
    )
  );

  return steps;
}

// ── Export ───────────────────────────────────────────────────────────────────
export const matrixChain: AlgorithmDefinition<MatrixChainInput, DPTableState> =
  {
    slug: "matrix-chain",
    name: "Matrix Chain Multiplication",
    category: "dynamic-programming",
    difficulty: "advanced",
    tags: ["optimization", "interval-dp", "parenthesization"],
    summary:
      "Determine the optimal parenthesization of a matrix chain to minimise the total number of scalar multiplications.",

    description: `Matrix Chain Multiplication asks: given a sequence of matrices, in what order should we perform the multiplications to minimise the total number of scalar operations? Because matrix multiplication is associative, the order of parenthesization can dramatically affect cost — the difference can be orders of magnitude for long chains.

The algorithm builds a 2-D DP table where dp[i][j] holds the minimum cost to multiply matrices i through j. It fills the table by increasing chain length, and for each subproblem tries every possible split point k, combining the costs of the left and right sub-chains with the cost of the final merge.

**Recurrence:** dp[i][j] = min over k in [i, j-1] of { dp[i][k] + dp[k+1][j] + p[i-1]·p[k]·p[j] }, where p is the dimension array.

**Base case:** dp[i][i] = 0 for all i (a single matrix needs no multiplication).

The O(n³) time complexity comes from the three nested loops: chain length, start index, and split point. This classic interval-DP pattern recurs throughout competitive programming in problems involving optimal tree structures, polygon triangulation, and optimal BST construction.`,

    realWorldUsage: [
      {
        system: "Compiler expression optimization",
        useCase:
          "Choosing evaluation order for chained linear-algebra expressions",
        why: "Compilers and JIT engines for array languages (NumPy, Julia, TensorFlow XLA) model a series of tensor contractions as a matrix chain and use DP to select the cheapest evaluation order before emitting code, saving redundant FLOPS at runtime.",
      },
      {
        system: "Graphics and game engine matrix pipelines",
        useCase:
          "Optimising batched transform chains for scene graph nodes",
        why: "A scene graph may accumulate dozens of 4×4 transform matrices per object. Choosing the cheapest parenthesization of these chains — especially when many objects share a common prefix — reduces CPU/GPU work per frame and improves throughput.",
      },
      {
        system: "Quantum circuit compilation",
        useCase: "Minimising gate count in unitary matrix decompositions",
        why: "Quantum compilers must decompose a target unitary into a product of hardware-native gates. Selecting the splitting order that minimises entangling-gate count is structurally identical to matrix chain optimisation over the SU(2) gate alphabet.",
      },
    ],

    complexity: {
      time: { best: "O(n³)", average: "O(n³)", worst: "O(n³)" },
      space: "O(n²)",
    },

    related: ["knapsack", "lcs"],
    implemented: true,
    defaultInput: DEFAULT_MATRIX_CHAIN_INPUT,
    generateSteps,

    code: {
      typescript: `function matrixChain(dims: number[]): number {
  const n = dims.length - 1;
  // dp[i][j] = min cost to multiply matrices i..j (1-indexed)
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let l = 2; l <= n; l++) {
    for (let i = 1; i <= n - l + 1; i++) {
      const j = i + l - 1;
      dp[i][j] = Infinity;
      for (let k = i; k < j; k++) {
        const cost = dp[i][k] + dp[k + 1][j] + dims[i - 1] * dims[k] * dims[j];
        if (cost < dp[i][j]) dp[i][j] = cost;
      }
    }
  }

  return dp[1][n];
}

// Usage — 6 matrices with dimensions from [30,35,15,5,10,20,25]
console.log(matrixChain([30, 35, 15, 5, 10, 20, 25])); // 15125`,

      go: `package main

import (
	"fmt"
	"math"
)

func matrixChain(dims []int) int {
	n := len(dims) - 1
	dp := make([][]int, n+1)
	for i := range dp {
		dp[i] = make([]int, n+1)
	}

	for l := 2; l <= n; l++ {
		for i := 1; i <= n-l+1; i++ {
			j := i + l - 1
			dp[i][j] = math.MaxInt64
			for k := i; k < j; k++ {
				cost := dp[i][k] + dp[k+1][j] + dims[i-1]*dims[k]*dims[j]
				if cost < dp[i][j] {
					dp[i][j] = cost
				}
			}
		}
	}

	return dp[1][n]
}

func main() {
	fmt.Println(matrixChain([]int{30, 35, 15, 5, 10, 20, 25})) // 15125
}`,

      rust: `fn matrix_chain(dims: &[usize]) -> usize {
    let n = dims.len() - 1;
    let mut dp = vec![vec![0usize; n + 1]; n + 1];

    for l in 2..=n {
        for i in 1..=(n - l + 1) {
            let j = i + l - 1;
            dp[i][j] = usize::MAX;
            for k in i..j {
                let cost = dp[i][k]
                    + dp[k + 1][j]
                    + dims[i - 1] * dims[k] * dims[j];
                if cost < dp[i][j] {
                    dp[i][j] = cost;
                }
            }
        }
    }

    dp[1][n]
}

fn main() {
    println!("{}", matrix_chain(&[30, 35, 15, 5, 10, 20, 25])); // 15125
}`,
    },
  };
