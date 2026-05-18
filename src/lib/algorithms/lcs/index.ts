import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ── Local state type ─────────────────────────────────────────────────────────
interface LCSState {
  rowLabels: string[];
  colLabels: string[];
  table: (number | null)[][];
  current: [number, number] | null;
  comparing: [number, number][];
  result: number | null;
  phase: string;
}

// ── Input ────────────────────────────────────────────────────────────────────
interface LCSInput {
  s1: string;
  s2: string;
}

const DEFAULT_LCS_INPUT: LCSInput = { s1: "ABCBDAB", s2: "BDCABA" };

// ── Step generator ───────────────────────────────────────────────────────────
function generateSteps(input: LCSInput): AlgorithmStep<LCSState>[] {
  const { s1, s2 } = input;
  const m = s1.length;
  const n = s2.length;
  const steps: AlgorithmStep<LCSState>[] = [];

  // Build labels: first cell is the empty-string sentinel
  const rowLabels = ["", ...s1.split("")];
  const colLabels = ["", ...s2.split("")];

  // Initialise table with nulls
  const table: (number | null)[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(null)
  );

  const snap = (
    description: string,
    current: [number, number] | null,
    comparing: [number, number][],
    result: number | null,
    phase: string
  ): AlgorithmStep<LCSState> => ({
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
    variables: result !== null ? { lcsLength: result } : {},
  });

  // Initial state — all nulls
  steps.push(
    snap(
      "Initialise the DP table. All cells are empty. We will fill row 0 and col 0 with zeros first.",
      null,
      [],
      null,
      "init"
    )
  );

  // Fill row 0 with zeros
  for (let j = 0; j <= n; j++) {
    table[0][j] = 0;
  }
  steps.push(
    snap(
      "Base case: row 0 is all zeros — an empty prefix of s1 has LCS length 0 with any prefix of s2.",
      null,
      [],
      null,
      "base-row"
    )
  );

  // Fill col 0 with zeros
  for (let i = 1; i <= m; i++) {
    table[i][0] = 0;
  }
  steps.push(
    snap(
      "Base case: col 0 is all zeros — any prefix of s1 has LCS length 0 with an empty prefix of s2.",
      null,
      [],
      null,
      "base-col"
    )
  );

  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        const val = (table[i - 1][j - 1] as number) + 1;
        table[i][j] = val;
        steps.push(
          snap(
            `s1[${i - 1}]='${s1[i - 1]}' matches s2[${j - 1}]='${s2[j - 1]}'. dp[${i}][${j}] = dp[${i - 1}][${j - 1}]+1 = ${val}.`,
            [i, j],
            [[i - 1, j - 1]],
            null,
            "fill"
          )
        );
      } else {
        const fromAbove = table[i - 1][j] as number;
        const fromLeft = table[i][j - 1] as number;
        const val = Math.max(fromAbove, fromLeft);
        table[i][j] = val;
        steps.push(
          snap(
            `No match. dp[${i}][${j}] = max(dp[${i - 1}][${j}], dp[${i}][${j - 1}]) = max(${fromAbove}, ${fromLeft}) = ${val}.`,
            [i, j],
            [
              [i - 1, j],
              [i, j - 1],
            ],
            null,
            "fill"
          )
        );
      }
    }
  }

  // Final step
  const result = table[m][n] as number;
  steps.push(
    snap(
      `LCS length = ${result}. The longest common subsequence of "${s1}" and "${s2}" has ${result} character${result === 1 ? "" : "s"}.`,
      [m, n],
      [],
      result,
      "done"
    )
  );

  return steps;
}

// ── Export ───────────────────────────────────────────────────────────────────
export const lcs: AlgorithmDefinition<LCSInput, LCSState> = {
  slug: "lcs",
  name: "Longest Common Subsequence",
  category: "dynamic-programming",
  difficulty: "intermediate",
  tags: ["dp", "2d-table", "subsequence", "string"],
  summary:
    "Find the length of the longest subsequence common to two strings using a 2-D DP table.",

  description: `Longest Common Subsequence (LCS) finds the longest sequence of characters that appear in the same relative order in both input strings — but not necessarily contiguously.

The algorithm builds an (m+1) × (n+1) table where dp[i][j] stores the LCS length of the first i characters of s1 and the first j characters of s2.

**Recurrence:**
- If s1[i-1] === s2[j-1]: dp[i][j] = dp[i-1][j-1] + 1  (extend the common prefix)
- Otherwise:             dp[i][j] = max(dp[i-1][j], dp[i][j-1])  (best without current char)

**Base cases:** dp[0][j] = dp[i][0] = 0 (empty string has LCS 0 with anything).

The answer sits at dp[m][n]. To recover the actual subsequence (not just its length), trace back through the table from dp[m][n] to dp[0][0].

LCS is closely related to Edit Distance: edit distance equals m + n − 2 × LCS(s1, s2) when only insertions and deletions are allowed.`,

  realWorldUsage: [
    {
      system: "Version control — diff/patch tools (git diff, GNU diff)",
      useCase: "Computing line-level diffs between file revisions",
      why: "Git's diff engine models each revision as a sequence of lines and finds their LCS. Lines inside the LCS are unchanged; lines outside form the insertions and deletions shown in the unified diff output. This keeps patches minimal and human-readable.",
    },
    {
      system: "Bioinformatics — sequence alignment pipelines",
      useCase: "Aligning DNA, RNA, or protein sequences to find conserved regions",
      why: "Conserved subsequences across species indicate functional or evolutionary significance. Tools such as BLAST use LCS-style DP as a core primitive before applying gap penalties and scoring matrices (e.g. BLOSUM62) for full Smith-Waterman or Needleman-Wunsch alignment.",
    },
    {
      system: "Academic integrity / plagiarism detection",
      useCase: "Measuring token-level similarity between student submissions",
      why: "Systems like MOSS tokenise source code and compute LCS-based similarity scores. A high LCS ratio between two submissions — after normalising identifiers — is a strong signal of code copying even when variable names or formatting have been changed.",
    },
  ],

  complexity: {
    time: { best: "O(mn)", average: "O(mn)", worst: "O(mn)" },
    space: "O(mn)",
  },

  related: ["edit-distance", "knapsack"],
  implemented: true,
  defaultInput: DEFAULT_LCS_INPUT,
  generateSteps,

  code: {
    typescript: `function lcs(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

// Usage
console.log(lcs("ABCBDAB", "BDCABA")); // 4`,

    go: `package main

import "fmt"

func lcs(s1, s2 string) int {
	m, n := len(s1), len(s2)
	dp := make([][]int, m+1)
	for i := range dp {
		dp[i] = make([]int, n+1)
	}

	for i := 1; i <= m; i++ {
		for j := 1; j <= n; j++ {
			if s1[i-1] == s2[j-1] {
				dp[i][j] = dp[i-1][j-1] + 1
			} else {
				if dp[i-1][j] > dp[i][j-1] {
					dp[i][j] = dp[i-1][j]
				} else {
					dp[i][j] = dp[i][j-1]
				}
			}
		}
	}

	return dp[m][n]
}

func main() {
	fmt.Println(lcs("ABCBDAB", "BDCABA")) // 4
}`,

    rust: `fn lcs(s1: &str, s2: &str) -> usize {
    let s1: Vec<char> = s1.chars().collect();
    let s2: Vec<char> = s2.chars().collect();
    let m = s1.len();
    let n = s2.len();

    let mut dp = vec![vec![0usize; n + 1]; m + 1];

    for i in 1..=m {
        for j in 1..=n {
            dp[i][j] = if s1[i - 1] == s2[j - 1] {
                dp[i - 1][j - 1] + 1
            } else {
                dp[i - 1][j].max(dp[i][j - 1])
            };
        }
    }

    dp[m][n]
}

fn main() {
    println!("{}", lcs("ABCBDAB", "BDCABA")); // 4
}`,
  },
};
