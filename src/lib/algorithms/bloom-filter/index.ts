import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface BloomFilterState {
  bits: boolean[];
  size: number;
  hashFunctions: number;
  insertedItems: string[];
  currentItem: string | null;
  hashPositions: number[];
  operation: "insert" | "query" | null;
  result: boolean | null;
  falsePositive: boolean;
  phase: "hashing" | "setting" | "done";
}

type BloomFilterInput = {
  size: number;
  hashFunctions: number;
  insertItems: string[];
  queryItems: string[];
};

// ── Hash functions ────────────────────────────────────────────────────────────
// All deterministic and purely based on character codes.

function h1(s: string, size: number): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return sum % size;
}

function h2(s: string, size: number): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return (sum * 31) % size;
}

function h3(s: string, size: number): number {
  return (s.charCodeAt(0) * 17 + s.length * 7) % size;
}

function getHashPositions(item: string, size: number): [number, number, number] {
  return [h1(item, size), h2(item, size), h3(item, size)];
}

// ── Generator ─────────────────────────────────────────────────────────────────

function generateSteps(input: BloomFilterInput): AlgorithmStep<BloomFilterState>[] {
  const { size, hashFunctions, insertItems, queryItems } = input;
  const steps: AlgorithmStep<BloomFilterState>[] = [];

  const bits = new Array<boolean>(size).fill(false);
  const insertedItems: string[] = [];

  function snapshot(
    operation: BloomFilterState["operation"],
    currentItem: string | null,
    hashPositions: number[],
    result: boolean | null,
    falsePositive: boolean,
    phase: BloomFilterState["phase"],
    description: string,
    variables?: Record<string, string | number | boolean>
  ): void {
    steps.push({
      description,
      state: {
        bits: [...bits],
        size,
        hashFunctions,
        insertedItems: [...insertedItems],
        currentItem,
        hashPositions: [...hashPositions],
        operation,
        result,
        falsePositive,
        phase,
      },
      highlights: Object.fromEntries(
        hashPositions.map((pos) => [pos, operation === "query" ? "compare" : "active"] as const)
      ),
      variables,
    });
  }

  // Initial state
  snapshot(null, null, [], null, false, "done",
    `Bloom filter initialized: ${size} bits, all set to 0. Using ${hashFunctions} hash functions.`,
    { size, hashFunctions });

  // ── Insertions ─────────────────────────────────────────────────────────────
  for (const item of insertItems) {
    const [p1, p2, p3] = getHashPositions(item, size);

    // Hashing phase
    snapshot("insert", item, [], null, false, "hashing",
      `Insert "${item}": computing hash positions.`,
      { item });

    snapshot("insert", item, [p1], null, false, "hashing",
      `Insert "${item}": h1("${item}") = (sum of char codes) % ${size} = ${p1}.`,
      { h1: p1 });

    snapshot("insert", item, [p1, p2], null, false, "hashing",
      `Insert "${item}": h2("${item}") = (sum of char codes × 31) % ${size} = ${p2}.`,
      { h1: p1, h2: p2 });

    snapshot("insert", item, [p1, p2, p3], null, false, "hashing",
      `Insert "${item}": h3("${item}") = (charCode[0] × 17 + length × 7) % ${size} = ${p3}. Hash positions: [${p1}, ${p2}, ${p3}].`,
      { h1: p1, h2: p2, h3: p3 });

    // Setting phase — set bits one by one
    bits[p1] = true;
    snapshot("insert", item, [p1, p2, p3], null, false, "setting",
      `Insert "${item}": set bit ${p1} = 1 (h1).`,
      { h1: p1, bit: p1 });

    bits[p2] = true;
    snapshot("insert", item, [p1, p2, p3], null, false, "setting",
      `Insert "${item}": set bit ${p2} = 1 (h2).`,
      { h2: p2, bit: p2 });

    bits[p3] = true;
    insertedItems.push(item);
    snapshot("insert", item, [p1, p2, p3], null, false, "done",
      `Insert "${item}": set bit ${p3} = 1 (h3). Done — bits [${p1}, ${p2}, ${p3}] are now 1.`,
      { h3: p3, bit: p3, insertedCount: insertedItems.length });

    snapshot("insert", null, [], null, false, "done",
      `"${item}" inserted. ${insertedItems.length} item${insertedItems.length !== 1 ? "s" : ""} in filter.`);
  }

  // ── Queries ────────────────────────────────────────────────────────────────
  for (const item of queryItems) {
    const [p1, p2, p3] = getHashPositions(item, size);

    snapshot("query", item, [], null, false, "hashing",
      `Query "${item}": computing hash positions.`,
      { item });

    snapshot("query", item, [p1, p2, p3], null, false, "hashing",
      `Query "${item}": positions [${p1}, ${p2}, ${p3}] — same hash functions as insert.`,
      { h1: p1, h2: p2, h3: p3 });

    // Check each bit
    const bit1 = bits[p1];
    snapshot("query", item, [p1], null, false, "setting",
      `Query "${item}": bit[${p1}] = ${bit1 ? 1 : 0} (h1). ${bit1 ? "Set — continue." : "NOT set — definitely not in the filter."}`,
      { checkingBit: p1, value: bit1 ? 1 : 0 });

    if (!bit1) {
      snapshot("query", item, [p1, p2, p3], false, false, "done",
        `Query "${item}": bit[${p1}] is 0 — "${item}" is DEFINITELY NOT in the filter.`,
        { result: "absent" });
      continue;
    }

    const bit2 = bits[p2];
    snapshot("query", item, [p1, p2], null, false, "setting",
      `Query "${item}": bit[${p2}] = ${bit2 ? 1 : 0} (h2). ${bit2 ? "Set — continue." : "NOT set — definitely not in the filter."}`,
      { checkingBit: p2, value: bit2 ? 1 : 0 });

    if (!bit2) {
      snapshot("query", item, [p1, p2, p3], false, false, "done",
        `Query "${item}": bit[${p2}] is 0 — "${item}" is DEFINITELY NOT in the filter.`,
        { result: "absent" });
      continue;
    }

    const bit3 = bits[p3];
    snapshot("query", item, [p1, p2, p3], null, false, "setting",
      `Query "${item}": bit[${p3}] = ${bit3 ? 1 : 0} (h3). ${bit3 ? "All bits set." : "NOT set — definitely not in the filter."}`,
      { checkingBit: p3, value: bit3 ? 1 : 0 });

    if (!bit3) {
      snapshot("query", item, [p1, p2, p3], false, false, "done",
        `Query "${item}": bit[${p3}] is 0 — "${item}" is DEFINITELY NOT in the filter.`,
        { result: "absent" });
      continue;
    }

    // All bits set — could be present or false positive
    const actuallyInserted = insertedItems.includes(item);
    const falsePositive = !actuallyInserted;

    snapshot("query", item, [p1, p2, p3], true, falsePositive, "done",
      falsePositive
        ? `Query "${item}": all bits [${p1}, ${p2}, ${p3}] are 1 — POSSIBLE MATCH (but "${item}" was never inserted — this is a FALSE POSITIVE!)`
        : `Query "${item}": all bits [${p1}, ${p2}, ${p3}] are 1 — PROBABLY IN the filter. (Correct: "${item}" was inserted.)`,
      { result: falsePositive ? "false positive" : "probably present" });
  }

  return steps;
}

export const bloomFilter: AlgorithmDefinition<BloomFilterInput, BloomFilterState> = {
  slug: "bloom-filter",
  name: "Bloom Filter",
  category: "data-structure",
  difficulty: "advanced",
  tags: ["bloom-filter", "probabilistic", "hashing", "space-efficient", "false-positive"],
  summary: "A space-efficient probabilistic data structure that tests set membership with possible false positives but no false negatives.",
  description: `A **Bloom Filter** is a probabilistic data structure that answers "is this element in the set?" using only a fixed bit array and multiple hash functions — consuming a tiny fraction of the memory a hash set would need.

**How it works:**
- **Insert**: run the item through k hash functions; set those k bit positions to 1.
- **Query**: run through the same k functions; if ANY bit is 0, the item is **definitely absent**. If all bits are 1, it is **probably present** (with a calculable false-positive rate).

**There are NO false negatives** — if an item was inserted, every query will say "probably present". There CAN be false positives, where bits set by other items accidentally match a new item's positions.

**Tuning**: with n expected items and desired false-positive rate p, optimal size is m = -n·ln(p)/(ln 2)² bits and k = (m/n)·ln 2 hash functions.`,
  realWorldUsage: [
    {
      system: "Google Bigtable / LevelDB / RocksDB",
      useCase: "Avoid disk reads for missing keys",
      why: "LSM-tree storage engines keep a Bloom filter per SSTable. Before doing an expensive disk read, they check the filter; a definitive 'absent' answer skips the I/O entirely, saving ~99% of unnecessary reads.",
    },
    {
      system: "Chrome Safe Browsing",
      useCase: "Malicious URL pre-filter",
      why: "Chrome stores a Bloom filter of known-malicious URL hashes locally. Most legitimate URLs are filtered locally with zero network round trips; only suspected hits trigger a server check.",
    },
    {
      system: "Akamai CDN",
      useCase: "One-hit-wonder cache filtering",
      why: "Akamai uses a Bloom filter to detect 'one-hit wonders' — objects requested only once. Items not seen before are not cached, saving cache space for genuinely popular objects.",
    },
    {
      system: "Bitcoin / Ethereum light clients",
      useCase: "SPV wallet transaction filtering",
      why: "BIP 37 (Bitcoin) uses Bloom filters so lightweight wallets can ask full nodes to send only transactions matching their address, without revealing which addresses they own.",
    },
  ],
  complexity: {
    time: { best: "O(k)", average: "O(k)", worst: "O(k)" },
    space: "O(m)",
    inPlace: true,
  },
  related: ["hash-map", "counting-bloom-filter", "cuckoo-filter", "hyperloglog"],
  implemented: true,
  defaultInput: {
    size: 16,
    hashFunctions: 3,
    insertItems: ["apple", "banana", "cherry"],
    queryItems: ["apple", "grape"],
  },
  generateSteps,
  code: {
    typescript: `class BloomFilter {
  private bits: boolean[];
  private size: number;

  constructor(size: number) {
    this.size = size;
    this.bits = new Array(size).fill(false);
  }

  private h1(s: string): number {
    let sum = 0;
    for (const c of s) sum += c.charCodeAt(0);
    return sum % this.size;
  }

  private h2(s: string): number {
    let sum = 0;
    for (const c of s) sum += c.charCodeAt(0);
    return (sum * 31) % this.size;
  }

  private h3(s: string): number {
    return (s.charCodeAt(0) * 17 + s.length * 7) % this.size;
  }

  insert(item: string): void {
    this.bits[this.h1(item)] = true;
    this.bits[this.h2(item)] = true;
    this.bits[this.h3(item)] = true;
  }

  query(item: string): boolean {
    return this.bits[this.h1(item)] &&
           this.bits[this.h2(item)] &&
           this.bits[this.h3(item)];
  }
}

const bf = new BloomFilter(16);
["apple", "banana", "cherry"].forEach(w => bf.insert(w));
console.log(bf.query("apple"));  // true  (definitely present)
console.log(bf.query("grape"));  // false (definitely absent) — or true (false positive)`,

    go: `package main

import "fmt"

type BloomFilter struct {
	bits []bool
	size int
}

func NewBloomFilter(size int) *BloomFilter {
	return &BloomFilter{bits: make([]bool, size), size: size}
}

func (bf *BloomFilter) h1(s string) int {
	sum := 0
	for _, c := range s { sum += int(c) }
	return sum % bf.size
}

func (bf *BloomFilter) h2(s string) int {
	sum := 0
	for _, c := range s { sum += int(c) }
	return (sum * 31) % bf.size
}

func (bf *BloomFilter) h3(s string) int {
	return (int(s[0])*17 + len(s)*7) % bf.size
}

func (bf *BloomFilter) Insert(item string) {
	bf.bits[bf.h1(item)] = true
	bf.bits[bf.h2(item)] = true
	bf.bits[bf.h3(item)] = true
}

func (bf *BloomFilter) Query(item string) bool {
	return bf.bits[bf.h1(item)] && bf.bits[bf.h2(item)] && bf.bits[bf.h3(item)]
}

func main() {
	bf := NewBloomFilter(16)
	for _, w := range []string{"apple", "banana", "cherry"} { bf.Insert(w) }
	fmt.Println(bf.Query("apple")) // true
	fmt.Println(bf.Query("grape")) // false (or true = false positive)
}`,

    rust: `struct BloomFilter {
    bits: Vec<bool>,
    size: usize,
}

impl BloomFilter {
    fn new(size: usize) -> Self {
        BloomFilter { bits: vec![false; size], size }
    }

    fn h1(&self, s: &str) -> usize {
        s.bytes().map(|b| b as usize).sum::<usize>() % self.size
    }

    fn h2(&self, s: &str) -> usize {
        (s.bytes().map(|b| b as usize).sum::<usize>() * 31) % self.size
    }

    fn h3(&self, s: &str) -> usize {
        let first = s.bytes().next().unwrap_or(0) as usize;
        (first * 17 + s.len() * 7) % self.size
    }

    fn insert(&mut self, item: &str) {
        let (p1, p2, p3) = (self.h1(item), self.h2(item), self.h3(item));
        self.bits[p1] = true;
        self.bits[p2] = true;
        self.bits[p3] = true;
    }

    fn query(&self, item: &str) -> bool {
        self.bits[self.h1(item)] && self.bits[self.h2(item)] && self.bits[self.h3(item)]
    }
}

fn main() {
    let mut bf = BloomFilter::new(16);
    for w in ["apple", "banana", "cherry"] { bf.insert(w); }
    println!("{}", bf.query("apple")); // true
    println!("{}", bf.query("grape")); // false (or true = false positive)
}`,
  },
};
