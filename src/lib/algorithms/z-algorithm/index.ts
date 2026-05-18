import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface StringMatchState {
  text: string;
  pattern: string;
  textIndex: number;
  patternIndex: number;
  matches: number[];
  mismatch: boolean;
  extra?: Record<string, unknown>;
  phase: "searching" | "done";
}

function generateSteps(input: { text: string; pattern: string }): AlgorithmStep<StringMatchState>[] {
  const { text, pattern } = input;
  const m = pattern.length;
  const n = text.length;
  const steps: AlgorithmStep<StringMatchState>[] = [];
  const matches: number[] = [];

  // Concatenated string: pattern + "$" + text
  const s = pattern + "$" + text;
  const sLen = s.length;
  const zArr: number[] = new Array(sLen).fill(0);

  let L = 0;
  let R = 0;

  // Build Z-array
  for (let i = 1; i < sLen; i++) {
    steps.push({
      description: `Building Z[${i}] for '${s[i]}'.`,
      state: {
        text,
        pattern,
        textIndex: Math.max(0, i - m - 1),
        patternIndex: 0,
        matches: [...matches],
        mismatch: false,
        extra: { zArray: [...zArr], s },
        phase: "searching",
      },
      highlights: { [`text-${Math.max(0, i - m - 1)}`]: "active" },
      variables: { i, L, R, "s[i]": s[i] },
    });

    if (i < R) {
      const cached = Math.min(R - i, zArr[i - L]);
      zArr[i] = cached;
      steps.push({
        description: `Use cached: Z[${i}] = min(${R - i}, ${zArr[i - L]}) = ${cached}.`,
        state: {
          text,
          pattern,
          textIndex: Math.max(0, i - m - 1),
          patternIndex: 0,
          matches: [...matches],
          mismatch: false,
          extra: { zArray: [...zArr], s },
          phase: "searching",
        },
        highlights: { [`text-${Math.max(0, i - m - 1)}`]: "compare" },
        variables: { i, L, R, "Z[i]": cached, "R-i": R - i, "Z[i-L]": zArr[i - L] },
      });
    }

    // Try to extend
    while (i + zArr[i] < sLen && s[zArr[i]] === s[i + zArr[i]]) {
      zArr[i]++;
    }

    if (zArr[i] > 0) {
      steps.push({
        description: `Z[${i}]=${zArr[i]} — '${s.slice(i, i + zArr[i])}' matches prefix.`,
        state: {
          text,
          pattern,
          textIndex: Math.max(0, i - m - 1),
          patternIndex: 0,
          matches: [...matches],
          mismatch: false,
          extra: { zArray: [...zArr], s },
          phase: "searching",
        },
        highlights: { [`text-${Math.max(0, i - m - 1)}`]: "found" },
        variables: { i, "Z[i]": zArr[i], L, R },
      });
    }

    if (i + zArr[i] > R) {
      L = i;
      R = i + zArr[i];
    }
  }

  // Search phase: scan the text portion of s (indices m+1 to sLen-1)
  for (let i = m + 1; i < sLen; i++) {
    const textPos = i - m - 1;

    steps.push({
      description: `Check Z[${i}]=${zArr[i]} at text position ${textPos}.`,
      state: {
        text,
        pattern,
        textIndex: textPos,
        patternIndex: 0,
        matches: [...matches],
        mismatch: zArr[i] < m,
        extra: { zArray: [...zArr] },
        phase: "searching",
      },
      highlights: { [`text-${textPos}`]: zArr[i] >= m ? "found" : "compare" },
      variables: { i, textPos, "Z[i]": zArr[i], m },
    });

    if (zArr[i] >= m) {
      matches.push(textPos);
      steps.push({
        description: `Z[${i}]=${zArr[i]} ≥ ${m}: match at text[${textPos}]!`,
        state: {
          text,
          pattern,
          textIndex: textPos,
          patternIndex: 0,
          matches: [...matches],
          mismatch: false,
          extra: { zArray: [...zArr] },
          phase: "searching",
        },
        highlights: Object.fromEntries(
          Array.from({ length: m }, (_, k) => [`text-${textPos + k}`, "found" as const])
        ),
        variables: { matchAt: textPos, totalMatches: matches.length },
      });
    }
  }

  steps.push({
    description: `Z-algorithm complete. Found ${matches.length} match(es) at indices [${matches.join(",")}].`,
    state: {
      text,
      pattern,
      textIndex: n - 1,
      patternIndex: 0,
      matches: [...matches],
      mismatch: false,
      extra: { zArray: [...zArr] },
      phase: "done",
    },
    highlights: {},
    variables: { totalMatches: matches.length },
  });

  return steps;
}

export const zAlgorithm: AlgorithmDefinition<{ text: string; pattern: string }, StringMatchState> = {
  slug: "z-algorithm",
  name: "Z-Algorithm",
  category: "string",
  difficulty: "intermediate",
  tags: ["pattern-matching", "z-array", "linear"],
  summary: "Build a Z-array on the concatenated string to find all pattern occurrences in linear time.",
  description: `The **Z-algorithm** constructs a *Z-array* for a string S where Z[i] is the length of the longest substring starting at S[i] that is also a prefix of S. To perform pattern search, the pattern P and text T are concatenated as "P$T" (the sentinel '$' prevents spurious Z-values spanning the boundary). Any position i in the text portion with Z[i] ≥ |P| marks a full pattern match.

Building the Z-array uses an expanding window [L, R] that tracks the rightmost Z-box seen so far, enabling O(1) reuse of previously computed values instead of re-extending from scratch. The full construction runs in O(n + m) time and O(n + m) space, making it linear end-to-end just like KMP. The Z-algorithm is conceptually simpler than KMP — it requires no separate failure-function phase — and is equally powerful, making it a popular choice in competitive programming and algorithms courses. Its applications extend beyond plain search: the Z-array of a single string directly reveals its string periods and repeating structure.`,
  realWorldUsage: [
    {
      system: "Bioinformatics / sequence alignment",
      useCase: "Genomics primer and motif search",
      why: "Tools like BWA and Bowtie use Z-function variants to locate short read sequences within reference genomes, exploiting the linear-time guarantee to process billions of base pairs efficiently.",
    },
    {
      system: "Text compression (LZ77/LZ78)",
      useCase: "Finding longest previous matches",
      why: "LZ77-family compressors (used in gzip, zstd) need to find the longest prefix match at each position. Z-array precomputation accelerates the match-finding step, a key inner loop of the compression algorithm.",
    },
    {
      system: "String periodicity analysis",
      useCase: "Period and border detection in strings",
      why: "Z[i] = |S| - i identifies a string period. Editors, diff tools, and data deduplication systems exploit this to detect run-length encoding opportunities and identify repeated structural units.",
    },
  ],
  complexity: {
    time: { best: "O(n+m)", average: "O(n+m)", worst: "O(n+m)" },
    space: "O(n)",
  },
  related: ["kmp", "rabin-karp"],
  implemented: true,
  defaultInput: { text: "AABABAABAABAB", pattern: "AABAB" },
  generateSteps,
  code: {
    typescript: `function buildZArray(s: string): number[] {
  const n = s.length;
  const z = new Array<number>(n).fill(0);
  let L = 0, R = 0;

  for (let i = 1; i < n; i++) {
    if (i < R) z[i] = Math.min(R - i, z[i - L]);
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++;
    if (i + z[i] > R) { L = i; R = i + z[i]; }
  }
  return z;
}

function zSearch(text: string, pattern: string): number[] {
  const m = pattern.length;
  const z = buildZArray(pattern + "$" + text);
  const matches: number[] = [];

  for (let i = m + 1; i < z.length; i++) {
    if (z[i] >= m) matches.push(i - m - 1);
  }
  return matches;
}

// Usage
console.log(zSearch("AABABAABAABAB", "AABAB")); // [3, 8]`,

    go: `package main

import "fmt"

func buildZArray(s string) []int {
	n := len(s)
	z := make([]int, n)
	l, r := 0, 0

	for i := 1; i < n; i++ {
		if i < r {
			if r-i < z[i-l] {
				z[i] = r - i
			} else {
				z[i] = z[i-l]
			}
		}
		for i+z[i] < n && s[z[i]] == s[i+z[i]] {
			z[i]++
		}
		if i+z[i] > r {
			l, r = i, i+z[i]
		}
	}
	return z
}

func zSearch(text, pattern string) []int {
	m := len(pattern)
	z := buildZArray(pattern + "$" + text)
	var matches []int

	for i := m + 1; i < len(z); i++ {
		if z[i] >= m {
			matches = append(matches, i-m-1)
		}
	}
	return matches
}

func main() {
	fmt.Println(zSearch("AABABAABAABAB", "AABAB")) // [3 8]
}`,

    rust: `fn build_z_array(s: &[u8]) -> Vec<usize> {
    let n = s.len();
    let mut z = vec![0usize; n];
    let (mut l, mut r) = (0usize, 0usize);

    for i in 1..n {
        if i < r {
            z[i] = (r - i).min(z[i - l]);
        }
        while i + z[i] < n && s[z[i]] == s[i + z[i]] {
            z[i] += 1;
        }
        if i + z[i] > r {
            l = i;
            r = i + z[i];
        }
    }
    z
}

fn z_search(text: &str, pattern: &str) -> Vec<usize> {
    let m = pattern.len();
    let concat = format!("{}\${}", pattern, text);
    let z = build_z_array(concat.as_bytes());
    let mut matches = Vec::new();

    for i in (m + 1)..z.len() {
        if z[i] >= m {
            matches.push(i - m - 1);
        }
    }
    matches
}

fn main() {
    println!("{:?}", z_search("AABABAABAABAB", "AABAB")); // [3, 8]
}`,
  },
};
