import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface TrieNode {
  id: number;
  char: string;
  isEnd: boolean;
  children: number[];
  x: number;
  y: number;
  state: "default" | "active" | "found" | "inserted" | "searching";
}

interface TrieState {
  nodes: TrieNode[];
  currentPath: number[];
  operation: "insert" | "search" | null;
  word: string | null;
  matchedSoFar: string;
  found: boolean | null;
  insertedWords: string[];
  phase: "traversing" | "done";
}

type TrieInput = {
  words: string[];
  searchWord: string;
};

// ── Layout ────────────────────────────────────────────────────────────────────
// SVG canvas: 620 × 280. Root at top centre.
// We do a two-pass layout: count subtree leaf-widths, then assign x/y.

const SVG_WIDTH = 620;
const LEVEL_HEIGHT = 60;
const ROOT_Y = 20;

function computeTrieLayout(
  nodeMap: Map<number, Omit<TrieNode, "x" | "y">>,
  childrenOf: Map<number, number[]>,
  root: number
): Map<number, { x: number; y: number }> {
  // Count leaves (nodes with no children) in each subtree
  const leafCount = new Map<number, number>();

  function countLeaves(id: number): number {
    const children = childrenOf.get(id) ?? [];
    if (children.length === 0) {
      leafCount.set(id, 1);
      return 1;
    }
    const total = children.reduce((s, c) => s + countLeaves(c), 0);
    leafCount.set(id, total);
    return total;
  }

  countLeaves(root);

  const positions = new Map<number, { x: number; y: number }>();

  function assign(id: number, xStart: number, xEnd: number, depth: number): void {
    const xMid = (xStart + xEnd) / 2;
    positions.set(id, { x: xMid, y: ROOT_Y + depth * LEVEL_HEIGHT });

    const children = childrenOf.get(id) ?? [];
    const totalLeaves = leafCount.get(id) ?? 1;
    let cursor = xStart;

    for (const child of children) {
      const childLeaves = leafCount.get(child) ?? 1;
      const childWidth = (xEnd - xStart) * (childLeaves / totalLeaves);
      assign(child, cursor, cursor + childWidth, depth + 1);
      cursor += childWidth;
    }
  }

  assign(root, 0, SVG_WIDTH, 0);
  return positions;
}

// ── Generator ─────────────────────────────────────────────────────────────────

function generateSteps(input: TrieInput): AlgorithmStep<TrieState>[] {
  const { words, searchWord } = input;
  const steps: AlgorithmStep<TrieState>[] = [];

  // Node storage (positions computed per snapshot)
  let nextId = 1; // 0 is reserved for root
  // map: id → node data (without x/y)
  const nodeData = new Map<number, Omit<TrieNode, "x" | "y">>();
  // parent → char → child id
  const charMap = new Map<number, Map<string, number>>();
  // For layout: parent → ordered children
  const childrenOf = new Map<number, number[]>();

  // Create root
  nodeData.set(0, { id: 0, char: "", isEnd: false, children: [], state: "default" });
  childrenOf.set(0, []);
  charMap.set(0, new Map());

  const insertedWords: string[] = [];

  function snapshot(
    operation: TrieState["operation"],
    word: string | null,
    matchedSoFar: string,
    currentPath: number[],
    found: boolean | null,
    phase: TrieState["phase"],
    activeStates: Map<number, TrieNode["state"]>,
    description: string,
    variables?: Record<string, string | number | boolean>
  ): void {
    const rawNodes = Array.from(nodeData.values());
    const positions = computeTrieLayout(nodeData, childrenOf, 0);

    const nodes: TrieNode[] = rawNodes.map((n) => {
      const pos = positions.get(n.id) ?? { x: SVG_WIDTH / 2, y: ROOT_Y };
      return {
        ...n,
        x: pos.x,
        y: pos.y,
        state: activeStates.get(n.id) ?? "default",
      };
    });

    steps.push({
      description,
      state: {
        nodes,
        currentPath: [...currentPath],
        operation,
        word,
        matchedSoFar,
        found,
        insertedWords: [...insertedWords],
        phase,
      },
      highlights: Object.fromEntries(
        Array.from(activeStates.entries()).map(([id, st]) => [
          id,
          st === "searching" ? "compare"
            : st === "found" ? "found"
            : st === "inserted" ? "sorted"
            : "active",
        ])
      ),
      variables,
    });
  }

  // Initial state
  snapshot(null, null, "", [], null, "done", new Map(),
    "Trie initialized with an empty root node.");

  // ── Insertions ─────────────────────────────────────────────────────────────
  for (const word of words) {
    const path: number[] = [0];
    const activeStates = new Map<number, TrieNode["state"]>();
    activeStates.set(0, "active");

    snapshot("insert", word, "", path, null, "traversing", new Map(activeStates),
      `Insert "${word}": start at root.`,
      { word });

    let current = 0;
    let matched = "";

    for (const ch of word) {
      matched += ch;
      const existing = charMap.get(current)?.get(ch);

      if (existing !== undefined) {
        // Node already exists — traverse
        activeStates.set(current, "default");
        activeStates.set(existing, "active");
        path.push(existing);
        current = existing;

        snapshot("insert", word, matched, path, null, "traversing", new Map(activeStates),
          `Insert "${word}": character '${ch}' already exists — traverse to node ${existing}.`,
          { char: ch, matched });
      } else {
        // Create new node
        const id = nextId++;
        nodeData.set(id, { id, char: ch, isEnd: false, children: [], state: "default" });
        childrenOf.set(id, []);

        if (!charMap.has(current)) charMap.set(current, new Map());
        charMap.get(current)!.set(ch, id);

        // Update parent's children list
        const parentData = nodeData.get(current)!;
        const updatedChildren = [...parentData.children, id];
        nodeData.set(current, { ...parentData, children: updatedChildren });
        childrenOf.get(current)!.push(id);

        activeStates.set(current, "default");
        activeStates.set(id, "inserted");
        path.push(id);
        current = id;

        snapshot("insert", word, matched, path, null, "traversing", new Map(activeStates),
          `Insert "${word}": new node for '${ch}' created (id=${id}).`,
          { char: ch, matched, newNodeId: id });
      }
    }

    // Mark end of word
    const finalNode = nodeData.get(current)!;
    nodeData.set(current, { ...finalNode, isEnd: true });
    activeStates.set(current, "inserted");

    insertedWords.push(word);

    snapshot("insert", word, matched, path, null, "done", new Map(activeStates),
      `Insert "${word}": mark node ${current} as end of word. Word fully inserted.`,
      { word, endNodeId: current });

    // Reset
    snapshot("insert", null, "", [], null, "done", new Map(),
      `"${word}" inserted. Trie now contains ${insertedWords.length} word${insertedWords.length !== 1 ? "s" : ""}.`);
  }

  // ── Search ─────────────────────────────────────────────────────────────────
  {
    const path: number[] = [0];
    const activeStates = new Map<number, TrieNode["state"]>();
    activeStates.set(0, "searching");
    let current = 0;
    let matched = "";

    snapshot("search", searchWord, "", path, null, "traversing", new Map(activeStates),
      `Search for "${searchWord}": start at root.`,
      { target: searchWord });

    let found = true;
    for (const ch of searchWord) {
      matched += ch;
      const next = charMap.get(current)?.get(ch);

      if (next === undefined) {
        found = false;
        snapshot("search", searchWord, matched, path, false, "done", new Map(activeStates),
          `Search "${searchWord}": no child '${ch}' from current node — not found.`,
          { char: ch, matched });
        break;
      }

      activeStates.set(current, "active");
      activeStates.set(next, "searching");
      path.push(next);
      current = next;

      snapshot("search", searchWord, matched, path, null, "traversing", new Map(activeStates),
        `Search "${searchWord}": found '${ch}' — move to node ${next}. Matched: "${matched}".`,
        { char: ch, matched });
    }

    if (found) {
      const endNode = nodeData.get(current)!;
      if (endNode.isEnd) {
        activeStates.set(current, "found");
        snapshot("search", searchWord, matched, path, true, "done", new Map(activeStates),
          `Search "${searchWord}": all characters matched and node is end-of-word. Found!`,
          { word: searchWord, result: "found" });
      } else {
        activeStates.set(current, "searching");
        snapshot("search", searchWord, matched, path, false, "done", new Map(activeStates),
          `Search "${searchWord}": all characters matched but node is NOT an end-of-word. Not found as a complete word.`,
          { word: searchWord, result: "prefix only" });
      }
    }
  }

  return steps;
}

export const trie: AlgorithmDefinition<TrieInput, TrieState> = {
  slug: "trie",
  name: "Trie (Prefix Tree)",
  category: "tree",
  difficulty: "intermediate",
  tags: ["trie", "prefix-tree", "string", "insert", "search"],
  summary: "A tree data structure that stores strings character by character, enabling fast prefix lookups.",
  description: `A **Trie** (pronounced "try", from re**trie**val) is a specialized tree where each node represents a single character. A path from the root to a terminal node spells out a stored word.

**Key properties:**
- Prefix sharing: words with a common prefix share nodes (e.g., "the", "their", "there" all share "t→h→e").
- O(m) insert and search, where m is the word length — independent of how many words are stored.
- Enables powerful prefix queries: autocomplete, spell-check, IP routing.

**Compared to a hash map**: a trie uses more memory per entry but natively supports ordered traversal and prefix matching, which hash maps cannot do efficiently.`,
  realWorldUsage: [
    {
      system: "Search engines / autocomplete",
      useCase: "Prefix suggestions",
      why: "Google's search bar and IDE auto-complete descend a trie (or a compressed variant like a DAWG/FST) to enumerate all completions for the typed prefix in microseconds.",
    },
    {
      system: "IP routing (Linux kernel)",
      useCase: "Longest-prefix match",
      why: "The Linux kernel's FIB trie performs longest-prefix-match on IP addresses using a bitwise trie, selecting the most specific routing rule for every packet.",
    },
    {
      system: "Spell checkers / dictionaries",
      useCase: "Word validation and suggestions",
      why: "Hunspell (used in LibreOffice, Firefox) stores dictionaries as compressed tries to check whether a string is a valid word and to enumerate similar words for suggestions.",
    },
  ],
  complexity: {
    time: { best: "O(m)", average: "O(m)", worst: "O(m)" },
    space: "O(n·m)",
    inPlace: false,
  },
  related: ["hash-map", "bst-insert-search", "aho-corasick", "radix-tree"],
  implemented: true,
  defaultInput: { words: ["the", "their", "there", "a", "any"], searchWord: "their" },
  generateSteps,
  code: {
    typescript: `class TrieNode {
  children = new Map<string, TrieNode>();
  isEnd = false;
}

class Trie {
  root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode());
      }
      node = node.children.get(ch)!;
    }
    node.isEnd = true;
  }

  search(word: string): boolean {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch)!;
    }
    return node.isEnd;
  }

  startsWith(prefix: string): boolean {
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch)!;
    }
    return true;
  }
}

const t = new Trie();
["the", "their", "there", "a", "any"].forEach(w => t.insert(w));
console.log(t.search("their"));    // true
console.log(t.search("th"));       // false (prefix only)
console.log(t.startsWith("th"));   // true`,

    go: `package main

import "fmt"

type TrieNode struct {
	children map[rune]*TrieNode
	isEnd    bool
}

func newNode() *TrieNode {
	return &TrieNode{children: make(map[rune]*TrieNode)}
}

func insert(root *TrieNode, word string) {
	cur := root
	for _, ch := range word {
		if _, ok := cur.children[ch]; !ok {
			cur.children[ch] = newNode()
		}
		cur = cur.children[ch]
	}
	cur.isEnd = true
}

func search(root *TrieNode, word string) bool {
	cur := root
	for _, ch := range word {
		if _, ok := cur.children[ch]; !ok {
			return false
		}
		cur = cur.children[ch]
	}
	return cur.isEnd
}

func main() {
	root := newNode()
	for _, w := range []string{"the", "their", "there", "a", "any"} {
		insert(root, w)
	}
	fmt.Println(search(root, "their")) // true
	fmt.Println(search(root, "th"))    // false
}`,

    rust: `use std::collections::HashMap;

#[derive(Default)]
struct TrieNode {
    children: HashMap<char, TrieNode>,
    is_end: bool,
}

struct Trie {
    root: TrieNode,
}

impl Trie {
    fn new() -> Self { Trie { root: TrieNode::default() } }

    fn insert(&mut self, word: &str) {
        let mut node = &mut self.root;
        for ch in word.chars() {
            node = node.children.entry(ch).or_default();
        }
        node.is_end = true;
    }

    fn search(&self, word: &str) -> bool {
        let mut node = &self.root;
        for ch in word.chars() {
            match node.children.get(&ch) {
                Some(n) => node = n,
                None => return false,
            }
        }
        node.is_end
    }
}

fn main() {
    let mut t = Trie::new();
    for w in ["the", "their", "there", "a", "any"] { t.insert(w); }
    println!("{}", t.search("their")); // true
    println!("{}", t.search("th"));    // false
}`,
  },
};
