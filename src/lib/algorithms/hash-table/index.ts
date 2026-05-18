import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ── State types ──────────────────────────────────────────────────────────────

interface HTBucket {
  key: number | null;
  value: number | null;
  chain: Array<{ key: number; value: number }>;
  state: "empty" | "occupied" | "deleted" | "active" | "found" | "collision";
}

interface HashTableState {
  buckets: HTBucket[];
  size: number;
  currentKey: number | null;
  currentHash: number | null;
  operation: "insert" | "search" | "delete" | null;
  probeSequence: number[];
  phase: "hashing" | "probing" | "done";
  loadFactor: number;
}

// ── Input ────────────────────────────────────────────────────────────────────

interface HTOperation {
  type: "insert" | "search" | "delete";
  key: number;
  value?: number;
}

interface HashTableInput {
  size: number;
  operations: HTOperation[];
}

const DEFAULT_INPUT: HashTableInput = {
  size: 11,
  operations: [
    { type: "insert", key: 5, value: 50 },
    { type: "insert", key: 16, value: 160 },
    { type: "insert", key: 27, value: 270 },
    { type: "insert", key: 8, value: 80 },
    { type: "insert", key: 19, value: 190 },
    { type: "insert", key: 3, value: 30 },
    { type: "search", key: 16 },
    { type: "search", key: 9 },
    { type: "delete", key: 5 },
    { type: "search", key: 5 },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyBucket(): HTBucket {
  return { key: null, value: null, chain: [], state: "empty" };
}

function countOccupied(buckets: HTBucket[]): number {
  return buckets.filter((b) => b.state === "occupied" || b.state === "active").length;
}

function snapshotBuckets(
  buckets: HTBucket[],
  overrides: Record<number, HTBucket["state"]> = {}
): HTBucket[] {
  return buckets.map((b, i) => ({
    ...b,
    chain: [...b.chain],
    state: overrides[i] !== undefined ? overrides[i] : b.state,
  }));
}

// ── Step generator ───────────────────────────────────────────────────────────

function generateSteps(input: HashTableInput): AlgorithmStep<HashTableState>[] {
  const { size, operations } = input;
  const steps: AlgorithmStep<HashTableState>[] = [];

  // Persistent table state (only "occupied" | "deleted" | "empty" in rest state)
  const table: HTBucket[] = Array.from({ length: size }, emptyBucket);

  const snap = (
    description: string,
    currentKey: number | null,
    currentHash: number | null,
    operation: HashTableState["operation"],
    probeSequence: number[],
    phase: HashTableState["phase"],
    bucketOverrides: Record<number, HTBucket["state"]> = {}
  ): AlgorithmStep<HashTableState> => {
    const occupied = table.filter(
      (b) => b.key !== null && b.state !== "deleted"
    ).length;
    return {
      description,
      state: {
        buckets: snapshotBuckets(table, bucketOverrides),
        size,
        currentKey,
        currentHash,
        operation,
        probeSequence: [...probeSequence],
        phase,
        loadFactor: occupied / size,
      },
      highlights: {},
      variables:
        currentKey !== null
          ? {
              key: currentKey,
              ...(currentHash !== null ? { hash: currentHash } : {}),
              loadFactor: +(occupied / size).toFixed(2),
            }
          : {},
    };
  };

  // Init step
  steps.push(
    snap(
      `Initialize hash table of size ${size}. All slots empty.`,
      null,
      null,
      null,
      [],
      "hashing"
    )
  );

  for (const op of operations) {
    const { type, key, value } = op;
    const hash = ((key % size) + size) % size;
    const probeSequence: number[] = [];

    // Hashing step
    steps.push(
      snap(
        `hash(${key}) = ${key} % ${size} = ${hash}.`,
        key,
        hash,
        type,
        [],
        "hashing"
      )
    );

    if (type === "insert") {
      let slot = hash;
      let probed = 0;

      while (probed < size) {
        const bucket = table[slot];

        if (bucket.state === "empty" || bucket.state === "deleted") {
          // Place here
          table[slot] = {
            key,
            value: value ?? null,
            chain: [],
            state: "occupied",
          };
          probeSequence.push(slot);
          steps.push(
            snap(
              `Insert key=${key}, value=${value ?? "?"} at slot ${slot}.`,
              key,
              hash,
              type,
              probeSequence,
              "done",
              { [slot]: "active" }
            )
          );
          break;
        } else {
          // Collision
          probeSequence.push(slot);
          steps.push(
            snap(
              `Slot ${slot} occupied by key=${bucket.key}. Probe next.`,
              key,
              hash,
              type,
              probeSequence,
              "probing",
              { [slot]: "collision" }
            )
          );
          slot = (slot + 1) % size;
          probed++;
        }
      }
    } else if (type === "search") {
      let slot = hash;
      let probed = 0;
      let found = false;

      while (probed < size) {
        const bucket = table[slot];

        if (bucket.state === "empty") {
          // Empty slot → key cannot exist
          probeSequence.push(slot);
          steps.push(
            snap(
              `Key not found (empty slot reached at ${slot}).`,
              key,
              hash,
              type,
              probeSequence,
              "done",
              { [slot]: "active" }
            )
          );
          found = true;
          break;
        } else if (bucket.state === "deleted") {
          // Tombstone — keep probing
          probeSequence.push(slot);
          steps.push(
            snap(
              `Slot ${slot} is a tombstone. Continue probing.`,
              key,
              hash,
              type,
              probeSequence,
              "probing",
              { [slot]: "collision" }
            )
          );
        } else if (bucket.key === key) {
          probeSequence.push(slot);
          steps.push(
            snap(
              `Found key=${key} at slot ${slot} with value=${bucket.value}.`,
              key,
              hash,
              type,
              probeSequence,
              "done",
              { [slot]: "found" }
            )
          );
          found = true;
          break;
        } else {
          // Occupied by different key
          probeSequence.push(slot);
          steps.push(
            snap(
              `Slot ${slot} has key=${bucket.key} ≠ ${key}. Probe next.`,
              key,
              hash,
              type,
              probeSequence,
              "probing",
              { [slot]: "collision" }
            )
          );
        }

        slot = (slot + 1) % size;
        probed++;
      }

      if (!found) {
        steps.push(
          snap(
            `Key=${key} not found after probing all slots.`,
            key,
            hash,
            type,
            probeSequence,
            "done"
          )
        );
      }
    } else if (type === "delete") {
      let slot = hash;
      let probed = 0;
      let deleted = false;

      while (probed < size) {
        const bucket = table[slot];

        if (bucket.state === "empty") {
          probeSequence.push(slot);
          steps.push(
            snap(
              `Key=${key} not found — empty slot at ${slot}. Cannot delete.`,
              key,
              hash,
              type,
              probeSequence,
              "done",
              { [slot]: "active" }
            )
          );
          deleted = true;
          break;
        } else if (bucket.state === "deleted") {
          probeSequence.push(slot);
          steps.push(
            snap(
              `Slot ${slot} is a tombstone. Continue probing.`,
              key,
              hash,
              type,
              probeSequence,
              "probing",
              { [slot]: "collision" }
            )
          );
        } else if (bucket.key === key) {
          // Mark as active before deletion
          probeSequence.push(slot);
          steps.push(
            snap(
              `Found key=${key} at slot ${slot}. Marking as deleted.`,
              key,
              hash,
              type,
              probeSequence,
              "probing",
              { [slot]: "active" }
            )
          );
          table[slot] = { key: null, value: null, chain: [], state: "deleted" };
          steps.push(
            snap(
              `Delete key=${key} from slot ${slot}. Marked as deleted (tombstone).`,
              key,
              hash,
              type,
              probeSequence,
              "done",
              { [slot]: "deleted" }
            )
          );
          deleted = true;
          break;
        } else {
          probeSequence.push(slot);
          steps.push(
            snap(
              `Slot ${slot} has key=${bucket.key} ≠ ${key}. Probe next.`,
              key,
              hash,
              type,
              probeSequence,
              "probing",
              { [slot]: "collision" }
            )
          );
        }

        slot = (slot + 1) % size;
        probed++;
      }

      if (!deleted) {
        steps.push(
          snap(
            `Key=${key} not found after full probe cycle.`,
            key,
            hash,
            type,
            probeSequence,
            "done"
          )
        );
      }
    }
  }

  // Final step
  const finalOccupied = countOccupied(table);
  const finalLoadFactor = finalOccupied / size;
  steps.push(
    snap(
      `All operations complete. Load factor: ${finalLoadFactor.toFixed(2)}.`,
      null,
      null,
      null,
      [],
      "done"
    )
  );

  return steps;
}

// ── Definition ───────────────────────────────────────────────────────────────

export const hashTable: AlgorithmDefinition<HashTableInput, HashTableState> = {
  slug: "hash-table",
  name: "Hash Table",
  category: "data-structure",
  difficulty: "intermediate",

  tags: ["hashing", "collision", "open-addressing", "chaining"],

  summary:
    "A hash table maps keys to values in O(1) average time using a hash function that converts keys into array indices, resolving collisions via linear probing.",

  description: `A **hash table** achieves amortized O(1) insert, search, and delete by mapping each key through a hash function to a slot in a fixed-size array. The hash function used here is the **division method**: \`hash(key) = key % size\`. When two keys map to the same slot — a **collision** — **linear probing** resolves it by scanning forward one slot at a time until an empty or deleted slot is found, wrapping around if needed.

Deletions require special care: simply emptying a slot would break probe chains for keys that "passed through" that slot during insertion. Instead, a **tombstone** (deleted marker) is left behind so probes continue past it during future searches. The **load factor** (occupied slots ÷ table size) is a critical metric; as it approaches 1.0, probe chains grow long and average-case performance degrades toward O(n). A well-tuned table keeps the load factor below 0.7 and rehashes (doubles capacity, re-inserts all keys) when that threshold is exceeded.

Open-addressing with linear probing exhibits excellent **cache locality** because probes access contiguous memory — the entire probe sequence often fits in a single cache line. This practical advantage often outweighs its theoretically worse worst-case compared to separate chaining (linked lists per bucket). Real-world implementations like Rust's \`HashMap\` use a variant called **Robin Hood hashing** — a form of open addressing that keeps probe distances balanced — while Python's \`dict\` uses a randomised open-addressing scheme to reduce clustering.`,

  realWorldUsage: [
    {
      system: "Python dict / JavaScript objects",
      useCase: "O(1) key-value storage underlying all object literals and dictionaries",
      why: "CPython's dict uses open-addressing with a prime-step probe to maintain O(1) amortized operations. V8 uses hidden classes backed by hash maps for object property lookups. Both rehash at ~2/3 load factor to keep performance predictable.",
    },
    {
      system: "Database indexes (PostgreSQL hash index)",
      useCase: "Equality lookups on indexed columns",
      why: "PostgreSQL's hash index type uses a multi-level bucket structure built on hashing to deliver O(1) equality lookups on indexed columns — significantly faster than B-tree's O(log n) for pure equality queries on large tables.",
    },
    {
      system: "Caches — Redis / Memcached",
      useCase: "In-memory key-value store serving millions of lookups per second",
      why: "Redis's main dictionary uses a double-hashing open-addressing table that incrementally rehashes in the background to avoid latency spikes. At 100k+ ops/sec, O(1) lookup with cache-friendly memory layout is non-negotiable.",
    },
  ],

  complexity: {
    time: { best: "O(1)", average: "O(1)", worst: "O(n)" },
    space: "O(n)",
  },

  related: ["binary-search", "bloom-filter"],
  implemented: true,
  defaultInput: DEFAULT_INPUT,
  generateSteps,

  code: {
    typescript: `class HashTable<V> {
  private size: number;
  private keys: (number | null)[];
  private vals: (V | null)[];
  private deleted: boolean[];

  constructor(size = 17) {
    this.size = size;
    this.keys = new Array(size).fill(null);
    this.vals = new Array(size).fill(null);
    this.deleted = new Array(size).fill(false);
  }

  private hash(key: number): number {
    return ((key % this.size) + this.size) % this.size;
  }

  insert(key: number, value: V): void {
    let slot = this.hash(key);
    for (let i = 0; i < this.size; i++) {
      const s = (slot + i) % this.size;
      if (this.keys[s] === null || this.deleted[s]) {
        this.keys[s] = key;
        this.vals[s] = value;
        this.deleted[s] = false;
        return;
      }
    }
    throw new Error("Hash table is full");
  }

  search(key: number): V | null {
    let slot = this.hash(key);
    for (let i = 0; i < this.size; i++) {
      const s = (slot + i) % this.size;
      if (this.keys[s] === null && !this.deleted[s]) return null;
      if (this.keys[s] === key && !this.deleted[s]) return this.vals[s];
    }
    return null;
  }

  delete(key: number): boolean {
    let slot = this.hash(key);
    for (let i = 0; i < this.size; i++) {
      const s = (slot + i) % this.size;
      if (this.keys[s] === null && !this.deleted[s]) return false;
      if (this.keys[s] === key && !this.deleted[s]) {
        this.keys[s] = null;
        this.vals[s] = null;
        this.deleted[s] = true; // tombstone
        return true;
      }
    }
    return false;
  }
}

const ht = new HashTable<number>();
ht.insert(5, 50);
ht.insert(16, 160);  // 16 % 11 = 5 → collision → slot 6
console.log(ht.search(16)); // 160
ht.delete(5);
console.log(ht.search(5));  // null`,

    go: `package main

import "fmt"

const empty = -1 << 62
const deleted = -1<<62 + 1

type HashTable struct {
	size int
	keys []int
	vals []int
}

func NewHashTable(size int) *HashTable {
	keys := make([]int, size)
	vals := make([]int, size)
	for i := range keys {
		keys[i] = empty
	}
	return &HashTable{size: size, keys: keys, vals: vals}
}

func (h *HashTable) hash(key int) int {
	r := key % h.size
	if r < 0 {
		r += h.size
	}
	return r
}

func (h *HashTable) Insert(key, val int) {
	slot := h.hash(key)
	for i := 0; i < h.size; i++ {
		s := (slot + i) % h.size
		if h.keys[s] == empty || h.keys[s] == deleted {
			h.keys[s] = key
			h.vals[s] = val
			return
		}
	}
	panic("hash table full")
}

func (h *HashTable) Search(key int) (int, bool) {
	slot := h.hash(key)
	for i := 0; i < h.size; i++ {
		s := (slot + i) % h.size
		if h.keys[s] == empty {
			return 0, false
		}
		if h.keys[s] == key {
			return h.vals[s], true
		}
	}
	return 0, false
}

func (h *HashTable) Delete(key int) bool {
	slot := h.hash(key)
	for i := 0; i < h.size; i++ {
		s := (slot + i) % h.size
		if h.keys[s] == empty {
			return false
		}
		if h.keys[s] == key {
			h.keys[s] = deleted // tombstone
			return true
		}
	}
	return false
}

func main() {
	ht := NewHashTable(11)
	ht.Insert(5, 50)
	ht.Insert(16, 160) // 16 % 11 = 5 → collision → slot 6
	if v, ok := ht.Search(16); ok {
		fmt.Println(v) // 160
	}
	ht.Delete(5)
	_, ok := ht.Search(5)
	fmt.Println(ok) // false
}`,

    rust: `use std::mem;

const EMPTY: i64 = i64::MIN;
const DELETED: i64 = i64::MIN + 1;

struct HashTable {
    size: usize,
    keys: Vec<i64>,
    vals: Vec<i64>,
}

impl HashTable {
    fn new(size: usize) -> Self {
        HashTable {
            size,
            keys: vec![EMPTY; size],
            vals: vec![0; size],
        }
    }

    fn hash(&self, key: i64) -> usize {
        key.rem_euclid(self.size as i64) as usize
    }

    fn insert(&mut self, key: i64, val: i64) {
        let slot = self.hash(key);
        for i in 0..self.size {
            let s = (slot + i) % self.size;
            if self.keys[s] == EMPTY || self.keys[s] == DELETED {
                self.keys[s] = key;
                self.vals[s] = val;
                return;
            }
        }
        panic!("hash table full");
    }

    fn search(&self, key: i64) -> Option<i64> {
        let slot = self.hash(key);
        for i in 0..self.size {
            let s = (slot + i) % self.size;
            if self.keys[s] == EMPTY { return None; }
            if self.keys[s] == key  { return Some(self.vals[s]); }
        }
        None
    }

    fn delete(&mut self, key: i64) -> bool {
        let slot = self.hash(key);
        for i in 0..self.size {
            let s = (slot + i) % self.size;
            if self.keys[s] == EMPTY { return false; }
            if self.keys[s] == key {
                self.keys[s] = DELETED; // tombstone
                return true;
            }
        }
        false
    }
}

fn main() {
    let mut ht = HashTable::new(11);
    ht.insert(5, 50);
    ht.insert(16, 160); // 16 % 11 = 5 → collision → slot 6
    println!("{:?}", ht.search(16)); // Some(160)
    ht.delete(5);
    println!("{:?}", ht.search(5));  // None
}`,
  },
};
