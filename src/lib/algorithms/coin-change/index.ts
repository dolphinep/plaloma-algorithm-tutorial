import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface CoinChangeState {
  coins: number[];
  amount: number;
  dp: (number | null)[];
  current: number | null;
  checkingCoin: number | null;
  phase: "filling" | "done";
}

type CoinChangeInput = { coins: number[]; amount: number };

const IMPOSSIBLE = 1e9;

function generateSteps(
  input: CoinChangeInput
): AlgorithmStep<CoinChangeState>[] {
  const { coins, amount } = input;
  const steps: AlgorithmStep<CoinChangeState>[] = [];
  const dp: (number | null)[] = Array(amount + 1).fill(null);

  // Init step
  steps.push({
    description: `Initialize DP table for amounts 0 through ${amount}. All values unknown.`,
    state: {
      coins: [...coins],
      amount,
      dp: [...dp],
      current: null,
      checkingCoin: null,
      phase: "filling",
    },
    highlights: {},
    variables: { amount, coins: coins.join(", ") },
  });

  // Base case dp[0] = 0
  dp[0] = 0;
  steps.push({
    description: `Base case: dp[0] = 0 (need 0 coins for amount 0).`,
    state: {
      coins: [...coins],
      amount,
      dp: [...dp],
      current: 0,
      checkingCoin: null,
      phase: "filling",
    },
    highlights: { dp_0: "found" },
    variables: { "dp[0]": 0 },
  });

  const dpWork: number[] = Array(amount + 1).fill(IMPOSSIBLE);
  dpWork[0] = 0;

  for (let i = 1; i <= amount; i++) {
    steps.push({
      description: `Computing dp[${i}]. Try each coin...`,
      state: {
        coins: [...coins],
        amount,
        dp: dp.map((v, idx) => (idx < i ? v : null)),
        current: i,
        checkingCoin: null,
        phase: "filling",
      },
      highlights: { [`dp_${i}`]: "active" },
      variables: { target: i },
    });

    for (const coin of coins) {
      if (coin <= i) {
        const prev = dpWork[i - coin];
        const candidate = prev === IMPOSSIBLE ? IMPOSSIBLE : prev + 1;
        steps.push({
          description: `Try coin ${coin}: dp[${i - coin}] = ${prev === IMPOSSIBLE ? "∞" : prev}, so dp[${i}] could be ${candidate === IMPOSSIBLE ? "∞" : candidate}.`,
          state: {
            coins: [...coins],
            amount,
            dp: dp.map((v, idx) => (idx <= i ? v : null)),
            current: i,
            checkingCoin: coin,
            phase: "filling",
          },
          highlights: {
            [`dp_${i}`]: "active",
            [`dp_${i - coin}`]: "compare",
          },
          variables: {
            coin,
            [`dp[${i - coin}]`]: prev === IMPOSSIBLE ? "∞" : prev,
            candidate: candidate === IMPOSSIBLE ? "∞" : candidate,
          },
        });
        if (candidate < dpWork[i]) {
          dpWork[i] = candidate;
        }
      }
    }

    // Finalize dp[i]
    dp[i] = dpWork[i] === IMPOSSIBLE ? -1 : dpWork[i];
    steps.push({
      description: `dp[${i}] = ${dpWork[i] === IMPOSSIBLE ? "impossible" : dp[i]}.`,
      state: {
        coins: [...coins],
        amount,
        dp: [...dp],
        current: i,
        checkingCoin: null,
        phase: "filling",
      },
      highlights: {
        [`dp_${i}`]: dp[i] === -1 ? "compare" : "found",
      },
      variables: { [`dp[${i}]`]: dp[i] as number },
    });
  }

  // Final step
  steps.push({
    description: `dp[${amount}] = ${dp[amount]}. Need ${dp[amount] === -1 ? "impossible number of" : dp[amount]} coins to make ${amount}.`,
    state: {
      coins: [...coins],
      amount,
      dp: [...dp],
      current: null,
      checkingCoin: null,
      phase: "done",
    },
    highlights: Object.fromEntries(
      Array.from({ length: amount + 1 }, (_, i) => [
        `dp_${i}`,
        "sorted" as const,
      ])
    ),
    variables: {
      result: dp[amount] as number,
      amount,
    },
  });

  return steps;
}

export const coinChange: AlgorithmDefinition<CoinChangeInput, CoinChangeState> =
  {
    slug: "coin-change",
    name: "Coin Change",
    category: "dynamic-programming",
    difficulty: "intermediate",
    tags: ["dp", "tabulation", "bottom-up", "unbounded-knapsack", "greedy"],
    summary:
      "Find the minimum number of coins needed to make a target amount using dynamic programming, building up solutions for all sub-amounts from 0 to the target.",

    description: `The Coin Change problem asks: given coin denominations and a target amount, what is the **minimum number of coins** needed to reach that amount exactly? Unlike greedy approaches — which fail for arbitrary denominations (e.g., coins [1, 3, 4] and target 6: greedy picks 4+1+1=3 coins, but 3+3=2 coins is optimal) — the DP approach guarantees the globally optimal solution by solving every sub-amount first.

The bottom-up tabulation strategy builds a table dp[0..amount] where dp[i] stores the minimum coins to form amount i. The recurrence is dp[i] = min over all coins c where c ≤ i of (dp[i - c] + 1). The base case dp[0] = 0 anchors the recurrence: you need zero coins to make zero. For each amount i, we try every denomination and take the option that results in the fewest total coins. If no denomination can reach i (dp[i] remains ∞), the amount is declared impossible and stored as -1. Time complexity is O(n × amount) where n is the number of coin denominations, and space is O(amount).

This problem is structurally equivalent to the **unbounded knapsack** problem because coins can be reused any number of times. It also appears in disguise throughout software engineering: any time you need to decompose a value into the fewest discrete units — packet sizes, cache line boundaries, register allocations — the same DP recurrence applies. Mastering Coin Change unlocks a broad family of DP problems including Climbing Stairs, Word Break, and Combination Sum IV.`,

    realWorldUsage: [
      {
        system: "ATM and cash dispensing systems",
        useCase: "Optimal banknote combination for requested withdrawal amounts",
        why: "ATMs must dispense exact amounts using available bill denominations (e.g., $100, $50, $20) while minimizing the number of bills used. Coin Change DP solves this in O(denominations × amount) at transaction time, handling irregular denomination sets that greedy algorithms would fail on.",
      },
      {
        system: "Vending machines and point-of-sale terminals",
        useCase: "Minimum-coin change-making for customer transactions",
        why: "POS systems compute optimal change to return using available coin inventory. When certain denominations are depleted, the greedy approach breaks down. The DP table is recomputed whenever coin inventory changes, ensuring the machine never claims change is impossible when it is actually achievable.",
      },
      {
        system: "Currency exchange and remittance platforms",
        useCase: "Minimizing transaction count in multi-currency settlement",
        why: "International payment networks decompose transfer amounts into standard lot sizes or SWIFT transaction units to minimize clearing fees. The Coin Change recurrence models available lot sizes as coin denominations, minimizing the number of sub-transactions needed to settle a large transfer.",
      },
    ],

    complexity: {
      time: {
        best: "O(n·amount)",
        average: "O(n·amount)",
        worst: "O(n·amount)",
      },
      space: "O(amount)",
    },

    related: ["fibonacci-dp", "knapsack"],
    implemented: true,
    defaultInput: { coins: [1, 3, 4], amount: 6 },
    generateSteps,

    code: {
      typescript: `function coinChange(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] + 1 < dp[i]) {
        dp[i] = dp[i - coin] + 1;
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}

console.log(coinChange([1, 3, 4], 6));  // 2  (3+3)
console.log(coinChange([2], 3));         // -1 (impossible)
console.log(coinChange([1, 5, 6, 9], 11)); // 2 (5+6)`,

      go: `package main

import (
	"fmt"
	"math"
)

func coinChange(coins []int, amount int) int {
	dp := make([]int, amount+1)
	for i := range dp {
		dp[i] = math.MaxInt32
	}
	dp[0] = 0

	for i := 1; i <= amount; i++ {
		for _, coin := range coins {
			if coin <= i && dp[i-coin] != math.MaxInt32 {
				if dp[i-coin]+1 < dp[i] {
					dp[i] = dp[i-coin] + 1
				}
			}
		}
	}

	if dp[amount] == math.MaxInt32 {
		return -1
	}
	return dp[amount]
}

func main() {
	fmt.Println(coinChange([]int{1, 3, 4}, 6))     // 2
	fmt.Println(coinChange([]int{2}, 3))            // -1
	fmt.Println(coinChange([]int{1, 5, 6, 9}, 11)) // 2
}`,

      rust: `fn coin_change(coins: &[u64], amount: u64) -> i64 {
    let n = amount as usize;
    let mut dp = vec![u64::MAX; n + 1];
    dp[0] = 0;

    for i in 1..=n {
        for &coin in coins {
            if coin as usize <= i {
                let prev = dp[i - coin as usize];
                if prev != u64::MAX && prev + 1 < dp[i] {
                    dp[i] = prev + 1;
                }
            }
        }
    }

    if dp[n] == u64::MAX { -1 } else { dp[n] as i64 }
}

fn main() {
    println!("{}", coin_change(&[1, 3, 4], 6));     // 2
    println!("{}", coin_change(&[2], 3));            // -1
    println!("{}", coin_change(&[1, 5, 6, 9], 11)); // 2
}`,
    },
  };
