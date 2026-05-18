import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ── State type (repurposed DPTableState) ─────────────────────────────────────
// Rows = unique characters. Columns = ["Freq", "Code", "Bits"].
// table[i] = [freq, codeLength | null, totalBits | null]
// `comparing` highlights which rows are being merged in the current step.

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

interface HuffmanInput {
  text: string;
}

const DEFAULT_INPUT: HuffmanInput = { text: "ABRACADABRA" };

// ── Min-heap (priority queue) ────────────────────────────────────────────────

interface HuffNode {
  char: string | null; // null for internal nodes
  freq: number;
  left: HuffNode | null;
  right: HuffNode | null;
}

function heapPush(heap: HuffNode[], node: HuffNode): void {
  heap.push(node);
  let i = heap.length - 1;
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (heap[parent].freq <= heap[i].freq) break;
    [heap[parent], heap[i]] = [heap[i], heap[parent]];
    i = parent;
  }
}

function heapPop(heap: HuffNode[]): HuffNode {
  const top = heap[0];
  const last = heap.pop()!;
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    while (true) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let smallest = i;
      if (l < heap.length && heap[l].freq < heap[smallest].freq) smallest = l;
      if (r < heap.length && heap[r].freq < heap[smallest].freq) smallest = r;
      if (smallest === i) break;
      [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
      i = smallest;
    }
  }
  return top;
}

// ── Step generator ───────────────────────────────────────────────────────────

function generateSteps(input: HuffmanInput): AlgorithmStep<DPTableState>[] {
  const { text } = input;
  const steps: AlgorithmStep<DPTableState>[] = [];

  // 1. Count frequencies
  const freqMap = new Map<string, number>();
  for (const ch of text) {
    freqMap.set(ch, (freqMap.get(ch) ?? 0) + 1);
  }

  // Stable order: sort by char for determinism
  const chars = [...freqMap.keys()].sort();
  const n = chars.length;

  // Build index map char → row index
  const charIndex = new Map<string, number>(chars.map((c, i) => [c, i]));

  // Labels: empty sentinel in position 0 to match LCS pattern
  const rowLabels = ["", ...chars];
  const colLabels = ["", "Freq", "Code", "Bits"];

  // Table: rows = chars, cols = [freq, codeLen, totalBits]
  // table[i][j]: i is 1-indexed into chars, j is 1..3
  const table: (number | null)[][] = Array.from({ length: n + 1 }, (_, i) =>
    i === 0 ? [null, null, null, null] : [null, null, null, null]
  );

  // Fill frequencies (col index 1)
  for (const [ch, freq] of freqMap) {
    const row = charIndex.get(ch)! + 1; // 1-indexed
    table[row][1] = freq;
    table[row][2] = null;
    table[row][3] = null;
  }

  const snap = (
    description: string,
    current: [number, number] | null,
    comparing: [number, number][],
    result: number | null,
    phase: string,
    variables?: Record<string, string | number | boolean>
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
    variables: variables ?? {},
  });

  // Initial step: show frequency table
  steps.push(
    snap(
      `Count frequencies in '${text}'.`,
      null,
      [],
      null,
      "freq",
      { text, uniqueChars: n }
    )
  );

  // Highlight each character's frequency
  for (const ch of chars) {
    const row = charIndex.get(ch)! + 1;
    const freq = freqMap.get(ch)!;
    steps.push(
      snap(
        `'${ch}' appears ${freq} time${freq !== 1 ? "s" : ""} in '${text}'.`,
        [row, 1],
        [],
        null,
        "freq",
        { char: ch, freq }
      )
    );
  }

  // 2. Build min-heap and merge
  const heap: HuffNode[] = [];
  for (const ch of chars) {
    heapPush(heap, { char: ch, freq: freqMap.get(ch)!, left: null, right: null });
  }

  // Record merge order for step generation
  // Also build the tree for code assignment later
  let root: HuffNode | null = null;

  while (heap.length > 1) {
    const a = heapPop(heap);
    const b = heapPop(heap);

    const rowA = a.char !== null ? charIndex.get(a.char)! + 1 : -1;
    const rowB = b.char !== null ? charIndex.get(b.char)! + 1 : -1;

    const labelA = a.char ?? `(${a.freq})`;
    const labelB = b.char ?? `(${b.freq})`;

    const merged: HuffNode = {
      char: null,
      freq: a.freq + b.freq,
      left: a,
      right: b,
    };

    const comparingRows: [number, number][] = [];
    if (rowA > 0) comparingRows.push([rowA, 1]);
    if (rowB > 0) comparingRows.push([rowB, 1]);

    steps.push(
      snap(
        `Merge '${labelA}'(freq=${a.freq}) + '${labelB}'(freq=${b.freq}) = new node (freq=${merged.freq}).`,
        null,
        comparingRows,
        null,
        "merge",
        { nodeA: labelA, freqA: a.freq, nodeB: labelB, freqB: b.freq, merged: merged.freq }
      )
    );

    heapPush(heap, merged);
    root = merged;
  }

  if (heap.length === 1 && root === null) {
    root = heap[0];
  }

  // 3. Assign codes via BFS/DFS
  const codes = new Map<string, string>();

  function assignCodes(node: HuffNode | null, prefix: string): void {
    if (!node) return;
    if (node.char !== null) {
      // Leaf: single-character text gets code "0"
      codes.set(node.char, prefix.length > 0 ? prefix : "0");
      return;
    }
    assignCodes(node.left, prefix + "0");
    assignCodes(node.right, prefix + "1");
  }

  if (root) assignCodes(root, "");

  // Emit steps for each code assignment and fill table cols 2 & 3
  let totalBits = 0;
  for (const ch of chars) {
    const code = codes.get(ch) ?? "";
    const codeLen = code.length;
    const freq = freqMap.get(ch)!;
    const charBits = freq * codeLen;
    totalBits += charBits;

    const row = charIndex.get(ch)! + 1;
    table[row][2] = codeLen;
    table[row][3] = charBits;

    steps.push(
      snap(
        `Assign '${ch}' → code "${code}" (length ${codeLen}). Contributes ${charBits} bits (${freq} × ${codeLen}).`,
        [row, 2],
        [[row, 1]],
        null,
        "assign",
        { char: ch, code, codeLen, freq, bits: charBits }
      )
    );
  }

  // Final step
  steps.push(
    snap(
      `Huffman coding complete. Total bits = ${totalBits} vs ${text.length * 8} uncompressed.`,
      null,
      [],
      totalBits,
      "done",
      { totalBits, uncompressed: text.length * 8, ratio: +((totalBits / (text.length * 8)) * 100).toFixed(1) }
    )
  );

  return steps;
}

// ── Definition ───────────────────────────────────────────────────────────────

export const huffmanCoding: AlgorithmDefinition<HuffmanInput, DPTableState> = {
  slug: "huffman-coding",
  name: "Huffman Coding",
  category: "greedy",
  difficulty: "intermediate",

  tags: ["compression", "greedy", "tree", "priority-queue"],

  summary:
    "Huffman coding assigns variable-length binary codes to characters based on frequency, using a greedy min-heap strategy to build an optimal prefix-free code tree.",

  description: `**Huffman coding** is a lossless data compression algorithm that assigns shorter binary codes to more frequent characters and longer codes to rarer ones. It works by building a binary **prefix tree** (trie) bottom-up: start with a min-heap of leaf nodes — one per unique character, keyed by frequency — then repeatedly extract the two lowest-frequency nodes and merge them into an internal node whose frequency is their sum. When only one node remains, it is the root. Each left edge is labeled 0 and each right edge 1; the code for a character is the path from the root to its leaf.

The key insight is **greedy optimality**: at each step, merging the two lowest-frequency nodes minimises the expected code length over the whole tree. This can be proven via an exchange argument — any tree that swaps the placement of the two minimum-frequency characters with higher-frequency ones produces a worse or equal total cost. The resulting code is **prefix-free**: no code is a prefix of another, so it can be decoded unambiguously without separator characters. Time complexity is O(n log n) dominated by the heap operations; in practice, the number of unique characters n is small (≤ 256 for ASCII), making the algorithm extremely fast.

Huffman coding is the final stage in many real-world compression pipelines. Formats like zlib/gzip first apply LZ77 (dictionary compression) to remove repeated substrings, then pass the resulting symbol stream through Huffman coding to squeeze out statistical redundancy. JPEG uses Huffman entropy coding on the quantised DCT coefficients, and MP3 uses it on the Huffman-coded Huffman indices. Understanding Huffman coding unlocks the entropy-coding layer present in nearly every modern compression and media format.`,

  realWorldUsage: [
    {
      system: "zlib / gzip / DEFLATE",
      useCase: "Entropy coding stage of general-purpose file and HTTP compression",
      why: "DEFLATE (used in .gz, .zip, .png, and HTTP Content-Encoding: gzip) chains LZ77 back-reference compression with Huffman coding. The Huffman stage can encode the most common literals in 1–3 bits, achieving 2–5× compression on typical text and 20–40% on already-compact binary formats.",
    },
    {
      system: "JPEG / PNG image formats",
      useCase: "Entropy coding of quantised DCT coefficients (JPEG) and filtered scanlines (PNG)",
      why: "JPEG uses Huffman coding after quantisation to pack the non-zero DCT coefficients. PNG applies DEFLATE (Huffman + LZ77) to filtered scanline data. In both cases, Huffman coding exploits the skewed frequency distribution of post-transform symbols to approach the Shannon entropy limit.",
    },
    {
      system: "MP3 / AAC audio compression",
      useCase: "Huffman entropy coding of quantised audio spectral coefficients",
      why: "After psychoacoustic modelling and MDCT transform, MP3 quantises spectral lines and feeds them through a Huffman coder with a fixed codebook of 32 tables chosen per granule. AAC extends this with arithmetic coding but retains Huffman tables for certain bands. The entropy stage typically contributes 10–25% of the total bitrate savings.",
    },
  ],

  complexity: {
    time: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
    space: "O(n)",
  },

  related: ["greedy-activity-selection"],
  implemented: true,
  defaultInput: DEFAULT_INPUT,
  generateSteps,

  code: {
    typescript: `interface HuffNode {
  char: string | null;
  freq: number;
  left: HuffNode | null;
  right: HuffNode | null;
}

function buildHuffmanTree(text: string): Map<string, string> {
  const freq = new Map<string, number>();
  for (const c of text) freq.set(c, (freq.get(c) ?? 0) + 1);

  // Min-heap via sorted array (fine for small alphabets)
  let heap: HuffNode[] = [...freq.entries()].map(([char, f]) => ({
    char, freq: f, left: null, right: null,
  }));
  heap.sort((a, b) => a.freq - b.freq);

  while (heap.length > 1) {
    const a = heap.shift()!;
    const b = heap.shift()!;
    const merged: HuffNode = { char: null, freq: a.freq + b.freq, left: a, right: b };
    // Insert in sorted position
    let i = heap.findIndex(n => n.freq > merged.freq);
    if (i === -1) i = heap.length;
    heap.splice(i, 0, merged);
  }

  const codes = new Map<string, string>();
  function walk(node: HuffNode | null, prefix: string) {
    if (!node) return;
    if (node.char !== null) { codes.set(node.char, prefix || "0"); return; }
    walk(node.left,  prefix + "0");
    walk(node.right, prefix + "1");
  }
  walk(heap[0], "");
  return codes;
}

const codes = buildHuffmanTree("ABRACADABRA");
for (const [ch, code] of [...codes.entries()].sort()) {
  console.log(\`\${ch}: \${code}\`);
}
// A: 0, B: 10, R: 110, C: 1110, D: 1111`,

    go: `package main

import (
	"container/heap"
	"fmt"
)

type Node struct {
	char        rune
	freq        int
	left, right *Node
}

type MinHeap []*Node

func (h MinHeap) Len() int            { return len(h) }
func (h MinHeap) Less(i, j int) bool  { return h[i].freq < h[j].freq }
func (h MinHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
func (h *MinHeap) Push(x interface{}) { *h = append(*h, x.(*Node)) }
func (h *MinHeap) Pop() interface{} {
	n := len(*h)
	x := (*h)[n-1]
	*h = (*h)[:n-1]
	return x
}

func buildCodes(node *Node, prefix string, codes map[rune]string) {
	if node == nil {
		return
	}
	if node.char != 0 {
		if prefix == "" {
			prefix = "0"
		}
		codes[node.char] = prefix
		return
	}
	buildCodes(node.left, prefix+"0", codes)
	buildCodes(node.right, prefix+"1", codes)
}

func huffman(text string) map[rune]string {
	freq := make(map[rune]int)
	for _, c := range text {
		freq[c]++
	}

	h := &MinHeap{}
	heap.Init(h)
	for ch, f := range freq {
		heap.Push(h, &Node{char: ch, freq: f})
	}

	for h.Len() > 1 {
		a := heap.Pop(h).(*Node)
		b := heap.Pop(h).(*Node)
		heap.Push(h, &Node{freq: a.freq + b.freq, left: a, right: b})
	}

	codes := make(map[rune]string)
	buildCodes(heap.Pop(h).(*Node), "", codes)
	return codes
}

func main() {
	for ch, code := range huffman("ABRACADABRA") {
		fmt.Printf("%c: %s\\n", ch, code)
	}
}`,

    rust: `use std::collections::{BinaryHeap, HashMap};
use std::cmp::Reverse;

#[derive(Debug)]
enum Node {
    Leaf { ch: char, freq: usize },
    Internal { freq: usize, left: Box<Node>, right: Box<Node> },
}

impl Node {
    fn freq(&self) -> usize {
        match self { Node::Leaf { freq, .. } | Node::Internal { freq, .. } => *freq }
    }
}

fn build_codes(node: &Node, prefix: String, codes: &mut HashMap<char, String>) {
    match node {
        Node::Leaf { ch, .. } => {
            codes.insert(*ch, if prefix.is_empty() { "0".into() } else { prefix });
        }
        Node::Internal { left, right, .. } => {
            build_codes(left,  prefix.clone() + "0", codes);
            build_codes(right, prefix        + "1", codes);
        }
    }
}

fn huffman(text: &str) -> HashMap<char, String> {
    let mut freq: HashMap<char, usize> = HashMap::new();
    for c in text.chars() { *freq.entry(c).or_insert(0) += 1; }

    // BinaryHeap is a max-heap; wrap in Reverse for min-heap behaviour
    let mut heap: BinaryHeap<(Reverse<usize>, usize, Box<Node>)> = BinaryHeap::new();
    let mut counter = 0usize;
    for (ch, f) in freq {
        heap.push((Reverse(f), counter, Box::new(Node::Leaf { ch, freq: f })));
        counter += 1;
    }

    while heap.len() > 1 {
        let (Reverse(fa), _, a) = heap.pop().unwrap();
        let (Reverse(fb), _, b) = heap.pop().unwrap();
        let merged = Node::Internal { freq: fa + fb, left: a, right: b };
        heap.push((Reverse(fa + fb), counter, Box::new(merged)));
        counter += 1;
    }

    let (_, _, root) = heap.pop().unwrap();
    let mut codes = HashMap::new();
    build_codes(&root, String::new(), &mut codes);
    codes
}

fn main() {
    let mut codes: Vec<_> = huffman("ABRACADABRA").into_iter().collect();
    codes.sort_by_key(|(c, _)| *c);
    for (ch, code) in codes { println!("{}: {}", ch, code); }
}`,
  },
};
