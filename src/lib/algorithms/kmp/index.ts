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
  const n = text.length;
  const m = pattern.length;
  const steps: AlgorithmStep<StringMatchState>[] = [];

  // Build failure (LPS) array
  const lps: number[] = new Array(m).fill(0);
  let len = 0;
  let i = 1;

  steps.push({
    description: `Build failure (LPS) array for pattern "${pattern}". lps[0] = 0 by definition.`,
    state: {
      text,
      pattern,
      textIndex: 0,
      patternIndex: 0,
      matches: [],
      mismatch: false,
      extra: { failure: [...lps] },
      phase: "searching",
    },
    highlights: { "pattern-0": "active" },
    variables: { len: 0, i: 1 },
  });

  while (i < m) {
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      steps.push({
        description: `Build failure array: lps[${i}]=${len}.`,
        state: {
          text,
          pattern,
          textIndex: 0,
          patternIndex: i,
          matches: [],
          mismatch: false,
          extra: { failure: [...lps] },
          phase: "searching",
        },
        highlights: { [`pattern-${i}`]: "compare", [`pattern-${len - 1}`]: "active" },
        variables: { i, len, "lps[i]": len },
      });
      i++;
    } else if (len !== 0) {
      len = lps[len - 1];
      steps.push({
        description: `Build failure array: lps[${i}]=${lps[i]}. Mismatch — fall back to lps[${len}].`,
        state: {
          text,
          pattern,
          textIndex: 0,
          patternIndex: i,
          matches: [],
          mismatch: true,
          extra: { failure: [...lps] },
          phase: "searching",
        },
        highlights: { [`pattern-${i}`]: "compare" },
        variables: { i, len, "lps[i]": lps[i] },
      });
    } else {
      lps[i] = 0;
      steps.push({
        description: `Build failure array: lps[${i}]=0. No prefix matches — set to 0.`,
        state: {
          text,
          pattern,
          textIndex: 0,
          patternIndex: i,
          matches: [],
          mismatch: false,
          extra: { failure: [...lps] },
          phase: "searching",
        },
        highlights: { [`pattern-${i}`]: "active" },
        variables: { i, len, "lps[i]": 0 },
      });
      i++;
    }
  }

  // Searching phase
  const matches: number[] = [];
  let ti = 0; // text pointer
  let j = 0;  // pattern pointer

  while (ti < n) {
    const tc = text[ti];
    const pc = pattern[j];

    steps.push({
      description: `Compare text[${ti}]='${tc}' with pattern[${j}]='${pc}'.`,
      state: {
        text,
        pattern,
        textIndex: ti,
        patternIndex: j,
        matches: [...matches],
        mismatch: false,
        extra: { failure: [...lps] },
        phase: "searching",
      },
      highlights: { [`text-${ti}`]: "compare", [`pattern-${j}`]: "compare" },
      variables: { i: ti, j, "text[i]": tc, "pattern[j]": pc },
    });

    if (tc === pc) {
      j++;
      steps.push({
        description: `Match! Moving forward.`,
        state: {
          text,
          pattern,
          textIndex: ti,
          patternIndex: j - 1,
          matches: [...matches],
          mismatch: false,
          extra: { failure: [...lps] },
          phase: "searching",
        },
        highlights: { [`text-${ti}`]: "found", [`pattern-${j - 1}`]: "found" },
        variables: { i: ti, j },
      });

      if (j === m) {
        const matchStart = ti - j + 1;
        matches.push(matchStart);
        steps.push({
          description: `Full match found at index ${matchStart}!`,
          state: {
            text,
            pattern,
            textIndex: ti,
            patternIndex: j - 1,
            matches: [...matches],
            mismatch: false,
            extra: { failure: [...lps] },
            phase: "searching",
          },
          highlights: {
            ...Object.fromEntries(
              Array.from({ length: m }, (_, k) => [`text-${matchStart + k}`, "found" as const])
            ),
          },
          variables: { matchAt: matchStart, totalMatches: matches.length },
        });
        j = lps[j - 1];
      }
    } else {
      if (j !== 0) {
        const fallback = lps[j - 1];
        steps.push({
          description: `Mismatch. Use failure function: j = lps[${j - 1}]=${fallback}.`,
          state: {
            text,
            pattern,
            textIndex: ti,
            patternIndex: j,
            matches: [...matches],
            mismatch: true,
            extra: { failure: [...lps] },
            phase: "searching",
          },
          highlights: { [`text-${ti}`]: "active", [`pattern-${j}`]: "active" },
          variables: { i: ti, j: fallback, "lps[j-1]": fallback },
        });
        j = fallback;
      } else {
        steps.push({
          description: `Mismatch at j=0. Advance text pointer.`,
          state: {
            text,
            pattern,
            textIndex: ti,
            patternIndex: 0,
            matches: [...matches],
            mismatch: true,
            extra: { failure: [...lps] },
            phase: "searching",
          },
          highlights: { [`text-${ti}`]: "active" },
          variables: { i: ti + 1, j: 0 },
        });
        ti++;
        continue;
      }
    }

    ti++;
  }

  steps.push({
    description: `KMP complete. Found ${matches.length} match(es) at indices [${matches.join(",")}].`,
    state: {
      text,
      pattern,
      textIndex: n - 1,
      patternIndex: 0,
      matches: [...matches],
      mismatch: false,
      extra: { failure: [...lps] },
      phase: "done",
    },
    highlights: {},
    variables: { totalMatches: matches.length },
  });

  return steps;
}

export const kmp: AlgorithmDefinition<{ text: string; pattern: string }, StringMatchState> = {
  slug: "kmp",
  name: "KMP (Knuth-Morris-Pratt)",
  category: "string",
  difficulty: "advanced",
  tags: ["pattern-matching", "linear", "failure-function"],
  summary: "Linear-time string search using a precomputed failure function to skip redundant comparisons.",
  description: `The **Knuth-Morris-Pratt (KMP)** algorithm solves the string search problem in O(n + m) time by preprocessing the pattern into a *failure function* (also called the LPS — Longest Proper Prefix which is also Suffix — array). When a mismatch occurs during search, instead of restarting the pattern from the beginning, KMP uses the failure function to jump the pattern pointer back only as far as necessary. This avoids the O(nm) worst-case of naïve search entirely.

The two-phase approach first builds the LPS array by comparing the pattern against itself in O(m), then performs the main search sweep in O(n). Each character of the text is visited at most twice, giving a provably linear overall complexity regardless of the input. KMP is particularly efficient when the pattern contains many repeated substrings, as the failure function captures all reusable prefix information. It is foundational in text processing tools such as grep, and forms the basis of multi-pattern algorithms like Aho-Corasick.`,
  realWorldUsage: [
    {
      system: "grep / sed",
      useCase: "Text file pattern searching",
      why: "POSIX-compliant implementations of grep use KMP or its derivatives for fixed-string (-F) searches, guaranteeing linear time even on adversarial inputs crafted to defeat naïve backtracking.",
    },
    {
      system: "Bioinformatics pipelines",
      useCase: "DNA sequence matching",
      why: "Genome sequencing tools scan billions of base pairs for short primer or adapter sequences. KMP's O(n + m) guarantee makes it viable for these massive inputs where quadratic algorithms would be unusable.",
    },
    {
      system: "Aho-Corasick / network IDS",
      useCase: "Intrusion detection signature matching",
      why: "Network intrusion detection systems (Snort, Suricata) use Aho-Corasick, a multi-pattern extension of KMP, to match thousands of attack signatures against packet payloads simultaneously in linear time.",
    },
  ],
  complexity: {
    time: { best: "O(n+m)", average: "O(n+m)", worst: "O(n+m)" },
    space: "O(m)",
  },
  related: ["rabin-karp", "z-algorithm"],
  implemented: true,
  defaultInput: { text: "ABABCABABABC", pattern: "ABABC" },
  generateSteps,
  code: {
    typescript: `function buildLPS(pattern: string): number[] {
  const m = pattern.length;
  const lps = new Array<number>(m).fill(0);
  let len = 0;
  let i = 1;

  while (i < m) {
    if (pattern[i] === pattern[len]) {
      lps[i++] = ++len;
    } else if (len !== 0) {
      len = lps[len - 1];
    } else {
      lps[i++] = 0;
    }
  }
  return lps;
}

function kmpSearch(text: string, pattern: string): number[] {
  const n = text.length;
  const m = pattern.length;
  const lps = buildLPS(pattern);
  const matches: number[] = [];
  let i = 0; // text pointer
  let j = 0; // pattern pointer

  while (i < n) {
    if (text[i] === pattern[j]) {
      i++;
      j++;
    }
    if (j === m) {
      matches.push(i - j);
      j = lps[j - 1];
    } else if (i < n && text[i] !== pattern[j]) {
      j = j !== 0 ? lps[j - 1] : (i++, 0);
    }
  }
  return matches;
}

// Usage
console.log(kmpSearch("ABABCABABABC", "ABABC")); // [0, 6]`,

    go: `package main

import "fmt"

func buildLPS(pattern string) []int {
	m := len(pattern)
	lps := make([]int, m)
	length, i := 0, 1

	for i < m {
		if pattern[i] == pattern[length] {
			length++
			lps[i] = length
			i++
		} else if length != 0 {
			length = lps[length-1]
		} else {
			lps[i] = 0
			i++
		}
	}
	return lps
}

func kmpSearch(text, pattern string) []int {
	n, m := len(text), len(pattern)
	lps := buildLPS(pattern)
	var matches []int
	i, j := 0, 0

	for i < n {
		if text[i] == pattern[j] {
			i++
			j++
		}
		if j == m {
			matches = append(matches, i-j)
			j = lps[j-1]
		} else if i < n && text[i] != pattern[j] {
			if j != 0 {
				j = lps[j-1]
			} else {
				i++
			}
		}
	}
	return matches
}

func main() {
	fmt.Println(kmpSearch("ABABCABABABC", "ABABC")) // [0 6]
}`,

    rust: `fn build_lps(pattern: &[u8]) -> Vec<usize> {
    let m = pattern.len();
    let mut lps = vec![0usize; m];
    let mut len = 0;
    let mut i = 1;

    while i < m {
        if pattern[i] == pattern[len] {
            len += 1;
            lps[i] = len;
            i += 1;
        } else if len != 0 {
            len = lps[len - 1];
        } else {
            lps[i] = 0;
            i += 1;
        }
    }
    lps
}

fn kmp_search(text: &str, pattern: &str) -> Vec<usize> {
    let t = text.as_bytes();
    let p = pattern.as_bytes();
    let n = t.len();
    let m = p.len();
    let lps = build_lps(p);
    let mut matches = Vec::new();
    let (mut i, mut j) = (0, 0);

    while i < n {
        if t[i] == p[j] {
            i += 1;
            j += 1;
        }
        if j == m {
            matches.push(i - j);
            j = lps[j - 1];
        } else if i < n && t[i] != p[j] {
            if j != 0 {
                j = lps[j - 1];
            } else {
                i += 1;
            }
        }
    }
    matches
}

fn main() {
    println!("{:?}", kmp_search("ABABCABABABC", "ABABC")); // [0, 6]
}`,
  },
};
