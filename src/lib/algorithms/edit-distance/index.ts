import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ── Local state type ─────────────────────────────────────────────────────────
interface EditDistanceState {
  rowLabels: string[];
  colLabels: string[];
  table: (number | null)[][];
  current: [number, number] | null;
  comparing: [number, number][];
  result: number | null;
  phase: string;
}

// ── Input ────────────────────────────────────────────────────────────────────
interface EditDistanceInput {
  s1: string;
  s2: string;
}

const DEFAULT_EDIT_DISTANCE_INPUT: EditDistanceInput = {
  s1: "kitten",
  s2: "sitting",
};

// ── Step generator ───────────────────────────────────────────────────────────
function generateSteps(
  input: EditDistanceInput
): AlgorithmStep<EditDistanceState>[] {
  const { s1, s2 } = input;
  const m = s1.length;
  const n = s2.length;
  const steps: AlgorithmStep<EditDistanceState>[] = [];

  // Build labels: row 0 and col 0 are the empty-string sentinels
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
  ): AlgorithmStep<EditDistanceState> => ({
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
    variables: result !== null ? { editDistance: result } : {},
  });

  // Initial state
  steps.push(
    snap(
      `Initialise the DP table for "${s1}" → "${s2}". dp[i][j] = minimum edits to transform s1[0..i] into s2[0..j].`,
      null,
      [],
      null,
      "init"
    )
  );

  // Fill row 0: dp[0][j] = j — delete j characters from s2 side (insert j into s1)
  for (let j = 0; j <= n; j++) {
    table[0][j] = j;
  }
  steps.push(
    snap(
      "Base case: row 0 — transforming empty string into s2[0..j] costs j insertions.",
      null,
      [],
      null,
      "base-row"
    )
  );

  // Fill col 0: dp[i][0] = i — delete i characters from s1
  for (let i = 1; i <= m; i++) {
    table[i][0] = i;
  }
  steps.push(
    snap(
      "Base case: col 0 — transforming s1[0..i] into empty string costs i deletions.",
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
        const val = table[i - 1][j - 1] as number;
        table[i][j] = val;
        steps.push(
          snap(
            `'${s1[i - 1]}'==='${s2[j - 1]}'. No cost: dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${val}.`,
            [i, j],
            [[i - 1, j - 1]],
            null,
            "fill"
          )
        );
      } else {
        const replaceCost = table[i - 1][j - 1] as number;
        const deleteCost = table[i - 1][j] as number;
        const insertCost = table[i][j - 1] as number;
        const val = 1 + Math.min(replaceCost, deleteCost, insertCost);
        table[i][j] = val;
        steps.push(
          snap(
            `'${s1[i - 1]}'≠'${s2[j - 1]}'. Cost = 1 + min(replace=${replaceCost}, delete=${deleteCost}, insert=${insertCost}) = ${val}. dp[${i}][${j}] = ${val}.`,
            [i, j],
            [
              [i - 1, j - 1],
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
      `Edit distance = ${result}. Transforming "${s1}" into "${s2}" requires at minimum ${result} operation${result === 1 ? "" : "s"}.`,
      [m, n],
      [],
      result,
      "done"
    )
  );

  return steps;
}

// ── Export ───────────────────────────────────────────────────────────────────
export const editDistance: AlgorithmDefinition<
  EditDistanceInput,
  EditDistanceState
> = {
  slug: "edit-distance",
  name: "Edit Distance (Levenshtein)",
  category: "dynamic-programming",
  difficulty: "intermediate",
  tags: ["dp", "2d-table", "string", "levenshtein"],
  summary:
    "Compute the minimum number of single-character edits (insert, delete, replace) to transform one string into another.",

  description: `Edit Distance, also called Levenshtein Distance, measures how dissimilar two strings are by counting the fewest single-character operations required to transform one into the other.

Three operations are allowed, each costing 1:
- **Insert** a character
- **Delete** a character
- **Replace** a character with a different one

The algorithm builds an (m+1) × (n+1) table where dp[i][j] stores the minimum edit cost to transform s1[0..i-1] into s2[0..j-1].

**Recurrence:**
- If s1[i-1] === s2[j-1]: dp[i][j] = dp[i-1][j-1]  (characters match — no cost)
- Otherwise:              dp[i][j] = 1 + min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1])
  - dp[i-1][j-1] = replace s1[i-1] with s2[j-1]
  - dp[i-1][j]   = delete s1[i-1]
  - dp[i][j-1]   = insert s2[j-1]

**Base cases:** dp[0][j] = j (insert j chars), dp[i][0] = i (delete i chars).

The answer is dp[m][n]. Edit distance is a true metric: it satisfies non-negativity, identity, symmetry, and the triangle inequality.`,

  realWorldUsage: [
    {
      system: "Spell checkers in word processors and IDEs",
      useCase: "Suggesting the nearest correctly-spelled word for a typo",
      why: "When a word is not found in the dictionary, spell checkers compute Levenshtein distance from the unknown word to every dictionary candidate and rank suggestions by ascending distance. A threshold of 1–2 edits covers the vast majority of common typing mistakes with minimal false positives.",
    },
    {
      system: "Version control — git merge conflict resolution",
      useCase: "Three-way merging of text files modified by two branches",
      why: "Git's merge machinery uses edit-distance-based diffing to identify the minimal set of changes each branch made relative to the common ancestor. This lets it automatically merge non-overlapping edits and detect the exact lines in conflict when both branches modified the same region.",
    },
    {
      system: "Bioinformatics — DNA mutation analysis",
      useCase: "Quantifying the mutational distance between genetic sequences",
      why: "Edit distance over DNA/RNA strings (where insertions, deletions, and substitutions map to biological mutations) is used to measure sequence divergence, infer evolutionary relationships, and detect functionally significant mutations. It underlies global alignment algorithms like Needleman-Wunsch when all operation costs are equal.",
    },
  ],

  complexity: {
    time: { best: "O(mn)", average: "O(mn)", worst: "O(mn)" },
    space: "O(mn)",
  },

  related: ["lcs", "kmp"],
  implemented: true,
  defaultInput: DEFAULT_EDIT_DISTANCE_INPUT,
  generateSteps,

  code: {
    typescript: `function editDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j - 1], // replace
          dp[i - 1][j],     // delete
          dp[i][j - 1]      // insert
        );
      }
    }
  }

  return dp[m][n];
}

// Usage
console.log(editDistance("kitten", "sitting")); // 3`,

    go: `package main

import "fmt"

func editDistance(s1, s2 string) int {
	m, n := len(s1), len(s2)
	dp := make([][]int, m+1)
	for i := range dp {
		dp[i] = make([]int, n+1)
		dp[i][0] = i
	}
	for j := 0; j <= n; j++ {
		dp[0][j] = j
	}

	for i := 1; i <= m; i++ {
		for j := 1; j <= n; j++ {
			if s1[i-1] == s2[j-1] {
				dp[i][j] = dp[i-1][j-1]
			} else {
				mn := dp[i-1][j-1]
				if dp[i-1][j] < mn {
					mn = dp[i-1][j]
				}
				if dp[i][j-1] < mn {
					mn = dp[i][j-1]
				}
				dp[i][j] = 1 + mn
			}
		}
	}

	return dp[m][n]
}

func main() {
	fmt.Println(editDistance("kitten", "sitting")) // 3
}`,

    rust: `fn edit_distance(s1: &str, s2: &str) -> usize {
    let s1: Vec<char> = s1.chars().collect();
    let s2: Vec<char> = s2.chars().collect();
    let m = s1.len();
    let n = s2.len();

    let mut dp = vec![vec![0usize; n + 1]; m + 1];
    for i in 0..=m { dp[i][0] = i; }
    for j in 0..=n { dp[0][j] = j; }

    for i in 1..=m {
        for j in 1..=n {
            dp[i][j] = if s1[i - 1] == s2[j - 1] {
                dp[i - 1][j - 1]
            } else {
                1 + dp[i - 1][j - 1].min(dp[i - 1][j]).min(dp[i][j - 1])
            };
        }
    }

    dp[m][n]
}

fn main() {
    println!("{}", edit_distance("kitten", "sitting")); // 3
}`,
  },
};
