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

const BASE = 31;
const MOD = 1_000_003;

function charVal(c: string): number {
  return c.charCodeAt(0) - "A".charCodeAt(0) + 1;
}

function computeHash(s: string, start: number, length: number): number {
  let h = 0;
  for (let k = 0; k < length; k++) {
    h = (h * BASE + charVal(s[start + k])) % MOD;
  }
  return h;
}

function generateSteps(input: { text: string; pattern: string }): AlgorithmStep<StringMatchState>[] {
  const { text, pattern } = input;
  const n = text.length;
  const m = pattern.length;
  const steps: AlgorithmStep<StringMatchState>[] = [];
  const matches: number[] = [];

  if (m > n) {
    steps.push({
      description: "Pattern is longer than text. No matches possible.",
      state: { text, pattern, textIndex: 0, patternIndex: 0, matches: [], mismatch: false, extra: {}, phase: "done" },
      highlights: {},
    });
    return steps;
  }

  // Compute pattern hash
  const patternHash = computeHash(pattern, 0, m);
  steps.push({
    description: `Compute pattern hash: ${patternHash}.`,
    state: {
      text,
      pattern,
      textIndex: 0,
      patternIndex: m - 1,
      matches: [],
      mismatch: false,
      extra: { patternHash, windowHash: null },
      phase: "searching",
    },
    highlights: { [`pattern-${0}`]: "active", [`pattern-${m - 1}`]: "active" },
    variables: { patternHash },
  });

  // Compute initial window hash
  let windowHash = computeHash(text, 0, m);
  const initialWindow = text.slice(0, m);
  steps.push({
    description: `Initial window '${initialWindow}' hash: ${windowHash}.`,
    state: {
      text,
      pattern,
      textIndex: m - 1,
      patternIndex: m - 1,
      matches: [],
      mismatch: false,
      extra: { patternHash, windowHash },
      phase: "searching",
    },
    highlights: { [`text-${0}`]: "active", [`text-${m - 1}`]: "active" },
    variables: { patternHash, windowHash },
  });

  // Precompute BASE^(m-1) mod MOD for rolling hash removal
  let basePow = 1;
  for (let k = 0; k < m - 1; k++) {
    basePow = (basePow * BASE) % MOD;
  }

  for (let i = 0; i <= n - m; i++) {
    const window = text.slice(i, i + m);

    steps.push({
      description: `Window [${i}..${i + m - 1}] = '${window}'. Hash = ${windowHash}.`,
      state: {
        text,
        pattern,
        textIndex: i + m - 1,
        patternIndex: m - 1,
        matches: [...matches],
        mismatch: false,
        extra: { patternHash, windowHash },
        phase: "searching",
      },
      highlights: {
        [`text-${i}`]: "active",
        [`text-${i + m - 1}`]: "active",
      },
      variables: { i, windowHash, patternHash },
    });

    if (windowHash === patternHash) {
      // Verify char by char
      let verified = true;
      for (let j = 0; j < m; j++) {
        const a = text[i + j];
        const b = pattern[j];
        steps.push({
          description: `Hash match! Verify: text[${i + j}]='${a}' vs pattern[${j}]='${b}'`,
          state: {
            text,
            pattern,
            textIndex: i + j,
            patternIndex: j,
            matches: [...matches],
            mismatch: a !== b,
            extra: { patternHash, windowHash },
            phase: "searching",
          },
          highlights: {
            [`text-${i + j}`]: "compare",
            [`pattern-${j}`]: "compare",
          },
          variables: { "text[i+j]": a, "pattern[j]": b, match: a === b },
        });
        if (a !== b) {
          verified = false;
          break;
        }
      }

      if (verified) {
        matches.push(i);
        steps.push({
          description: `Match confirmed at index ${i}!`,
          state: {
            text,
            pattern,
            textIndex: i + m - 1,
            patternIndex: m - 1,
            matches: [...matches],
            mismatch: false,
            extra: { patternHash, windowHash },
            phase: "searching",
          },
          highlights: Object.fromEntries(
            Array.from({ length: m }, (_, k) => [`text-${i + k}`, "found" as const])
          ),
          variables: { matchAt: i, totalMatches: matches.length },
        });
      }
    } else {
      steps.push({
        description: `Hash mismatch (${windowHash} ≠ ${patternHash}). Slide window.`,
        state: {
          text,
          pattern,
          textIndex: i + m - 1,
          patternIndex: m - 1,
          matches: [...matches],
          mismatch: true,
          extra: { patternHash, windowHash },
          phase: "searching",
        },
        highlights: { [`text-${i}`]: "active", [`text-${i + m - 1}`]: "active" },
        variables: { windowHash, patternHash },
      });
    }

    // Rolling hash update
    if (i < n - m) {
      const removed = text[i];
      const added = text[i + m];
      const newHash = ((windowHash - charVal(removed) * basePow % MOD + MOD) * BASE + charVal(added)) % MOD;
      steps.push({
        description: `Rolling hash: remove '${removed}', add '${added}' → ${newHash}.`,
        state: {
          text,
          pattern,
          textIndex: i + m,
          patternIndex: m - 1,
          matches: [...matches],
          mismatch: false,
          extra: { patternHash, windowHash: newHash },
          phase: "searching",
        },
        highlights: { [`text-${i}`]: "sorted", [`text-${i + m}`]: "active" },
        variables: { removed, added, oldHash: windowHash, newHash },
      });
      windowHash = newHash;
    }
  }

  steps.push({
    description: `Rabin-Karp complete. Found ${matches.length} match(es) at indices [${matches.join(",")}].`,
    state: {
      text,
      pattern,
      textIndex: n - 1,
      patternIndex: 0,
      matches: [...matches],
      mismatch: false,
      extra: { patternHash, windowHash },
      phase: "done",
    },
    highlights: {},
    variables: { totalMatches: matches.length },
  });

  return steps;
}

export const rabinKarp: AlgorithmDefinition<{ text: string; pattern: string }, StringMatchState> = {
  slug: "rabin-karp",
  name: "Rabin-Karp",
  category: "string",
  difficulty: "intermediate",
  tags: ["pattern-matching", "rolling-hash", "hashing"],
  summary: "String search using a rolling polynomial hash to compare windows in O(1) per slide.",
  description: `**Rabin-Karp** is a string-search algorithm that uses *hashing* to find pattern matches. Instead of comparing the pattern character-by-character against every window of the text, it computes a hash of the pattern and a rolling hash of each text window; only when hashes agree does it fall back to a full character verification. The rolling hash update is computed in O(1) by removing the contribution of the outgoing character and adding the incoming one, making each window slide constant time.

The algorithm runs in O(n + m) average and best case, but degrades to O(nm) in the worst case if hash collisions are frequent. In practice, a good hash function (polynomial with a large prime modulus) keeps collisions extremely rare. Rabin-Karp's greatest strength is that it naturally extends to *multi-pattern search*: compute hashes for all patterns and check each window against the set in O(1) using a hash table, enabling simultaneous search for thousands of patterns in one linear pass.`,
  realWorldUsage: [
    {
      system: "Plagiarism detection",
      useCase: "Multi-pattern document fingerprinting",
      why: "Systems like MOSS and Turnitin hash overlapping k-gram windows of a submission and match them against a corpus. Rabin-Karp's ability to check many pattern hashes per window makes it the natural fit for this class of problem.",
    },
    {
      system: "Git",
      useCase: "Content-defined chunking for delta compression",
      why: "Git's pack-file format uses rolling Rabin-Karp-style hashes to split file content into variable-size chunks at content-defined boundaries, enabling efficient delta computation between similar objects.",
    },
    {
      system: "Database engines",
      useCase: "Query fingerprinting",
      why: "PostgreSQL's pg_stat_statements and similar tools hash normalized query strings using rolling-hash techniques to group structurally identical queries, avoiding full string comparison for every incoming query.",
    },
  ],
  complexity: {
    time: { best: "O(n+m)", average: "O(n+m)", worst: "O(nm)" },
    space: "O(1)",
  },
  related: ["kmp", "z-algorithm"],
  implemented: true,
  defaultInput: { text: "ABCABCABC", pattern: "CAB" },
  generateSteps,
  code: {
    typescript: `const BASE = 31;
const MOD = 1_000_003;

function charVal(c: string): number {
  return c.charCodeAt(0) - "A".charCodeAt(0) + 1;
}

function rabinKarp(text: string, pattern: string): number[] {
  const n = text.length;
  const m = pattern.length;
  const matches: number[] = [];

  // Precompute BASE^(m-1) mod MOD
  let basePow = 1;
  for (let k = 0; k < m - 1; k++) basePow = (basePow * BASE) % MOD;

  // Compute pattern hash and initial window hash
  let patternHash = 0;
  let windowHash = 0;
  for (let k = 0; k < m; k++) {
    patternHash = (patternHash * BASE + charVal(pattern[k])) % MOD;
    windowHash  = (windowHash  * BASE + charVal(text[k]))    % MOD;
  }

  for (let i = 0; i <= n - m; i++) {
    if (windowHash === patternHash) {
      // Verify to handle hash collisions
      if (text.slice(i, i + m) === pattern) matches.push(i);
    }
    if (i < n - m) {
      windowHash = ((windowHash - charVal(text[i]) * basePow % MOD + MOD) * BASE
                    + charVal(text[i + m])) % MOD;
    }
  }
  return matches;
}

// Usage
console.log(rabinKarp("ABCABCABC", "CAB")); // [2, 5]`,

    go: `package main

import "fmt"

const base = 31
const mod = 1_000_003

func charVal(c byte) int64 { return int64(c-'A') + 1 }

func rabinKarp(text, pattern string) []int {
	n, m := len(text), len(pattern)
	var matches []int

	// BASE^(m-1) mod MOD
	basePow := int64(1)
	for k := 0; k < m-1; k++ {
		basePow = basePow * base % mod
	}

	var patHash, winHash int64
	for k := 0; k < m; k++ {
		patHash = (patHash*base + charVal(pattern[k])) % mod
		winHash = (winHash*base + charVal(text[k])) % mod
	}

	for i := 0; i <= n-m; i++ {
		if winHash == patHash && text[i:i+m] == pattern {
			matches = append(matches, i)
		}
		if i < n-m {
			winHash = ((winHash-charVal(text[i])*basePow%mod+mod)*base+
				charVal(text[i+m])) % mod
		}
	}
	return matches
}

func main() {
	fmt.Println(rabinKarp("ABCABCABC", "CAB")) // [2 5]
}`,

    rust: `const BASE: u64 = 31;
const MOD: u64 = 1_000_003;

fn char_val(c: u8) -> u64 {
    (c - b'A') as u64 + 1
}

fn rabin_karp(text: &str, pattern: &str) -> Vec<usize> {
    let t = text.as_bytes();
    let p = pattern.as_bytes();
    let n = t.len();
    let m = p.len();
    let mut matches = Vec::new();

    // BASE^(m-1) mod MOD
    let mut base_pow = 1u64;
    for _ in 0..m.saturating_sub(1) {
        base_pow = base_pow * BASE % MOD;
    }

    let (mut pat_hash, mut win_hash) = (0u64, 0u64);
    for k in 0..m {
        pat_hash = (pat_hash * BASE + char_val(p[k])) % MOD;
        win_hash = (win_hash * BASE + char_val(t[k])) % MOD;
    }

    for i in 0..=(n - m) {
        if win_hash == pat_hash && &t[i..i + m] == p {
            matches.push(i);
        }
        if i < n - m {
            win_hash = ((win_hash + MOD - char_val(t[i]) * base_pow % MOD)
                * BASE + char_val(t[i + m])) % MOD;
        }
    }
    matches
}

fn main() {
    println!("{:?}", rabin_karp("ABCABCABC", "CAB")); // [2, 5]
}`,
  },
};
