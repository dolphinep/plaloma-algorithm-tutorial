import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

interface FenwickTreeState {
  original: number[];
  bit: number[];
  size: number;
  activeIndices: number[];
  queryRange: [number, number] | null;
  updateIndex: number | null;
  updateValue: number | null;
  operation: "build" | "query" | "update" | null;
  result: number | null;
  phase: "processing" | "done";
}

// lowbit: isolates the least significant set bit
function lowbit(x: number): number {
  return x & -x;
}

function generateSteps(input: { array: number[] }): AlgorithmStep<FenwickTreeState>[] {
  const { array } = input;
  const n = array.length;
  const steps: AlgorithmStep<FenwickTreeState>[] = [];

  // BIT is 1-indexed; bit[0] is unused
  const bit = new Array<number>(n + 1).fill(0);

  // ── PHASE 1: Build ─────────────────────────────────────────────────────────

  steps.push({
    description: `Initialize a Fenwick Tree (BIT) for the array [${array.join(", ")}]. The BIT is 1-indexed with ${n} elements. All cells start at 0.`,
    state: {
      original: [...array],
      bit: [...bit],
      size: n,
      activeIndices: [],
      queryRange: null,
      updateIndex: null,
      updateValue: null,
      operation: "build",
      result: null,
      phase: "processing",
    },
    highlights: {},
    variables: { n, phase: "build" },
  });

  for (let i = 1; i <= n; i++) {
    const val = array[i - 1];
    const affected: number[] = [];
    let j = i;

    // Collect all indices that will be updated before mutating
    while (j <= n) {
      affected.push(j);
      j += lowbit(j);
    }

    steps.push({
      description: `Insert element ${val} (0-indexed position ${i - 1}, 1-indexed position ${i}). Propagate update through BIT indices: [${affected.join(" → ")}].`,
      state: {
        original: [...array],
        bit: [...bit],
        size: n,
        activeIndices: affected,
        queryRange: null,
        updateIndex: i,
        updateValue: val,
        operation: "build",
        result: null,
        phase: "processing",
      },
      highlights: Object.fromEntries(affected.map((idx) => [idx, "active"])),
      variables: { insertAt: i, value: val, lowbit: lowbit(i) },
    });

    // Apply the update
    j = i;
    while (j <= n) {
      bit[j] += val;
      j += lowbit(j);
    }

    steps.push({
      description: `After inserting ${val}: BIT updated at indices [${affected.join(", ")}]. BIT state: [${bit.slice(1).join(", ")}].`,
      state: {
        original: [...array],
        bit: [...bit],
        size: n,
        activeIndices: affected,
        queryRange: null,
        updateIndex: i,
        updateValue: val,
        operation: "build",
        result: null,
        phase: i === n ? "done" : "processing",
      },
      highlights: Object.fromEntries(affected.map((idx) => [idx, "sorted"])),
      variables: { insertAt: i, value: val },
    });
  }

  steps.push({
    description: `Build complete. Final BIT: [${bit.slice(1).join(", ")}]. Each BIT[i] stores the sum of a range ending at i with length lowbit(i).`,
    state: {
      original: [...array],
      bit: [...bit],
      size: n,
      activeIndices: [],
      queryRange: null,
      updateIndex: null,
      updateValue: null,
      operation: "build",
      result: null,
      phase: "done",
    },
    highlights: {},
    variables: {},
  });

  // ── PHASE 2: Prefix sum query [1, 5] ───────────────────────────────────────

  const qL = 1;
  const qR = 5;

  steps.push({
    description: `Query prefix sum from index ${qL} to ${qR} (1-indexed). We compute prefixSum(${qR}) − prefixSum(${qL - 1}). Start with i = ${qR}.`,
    state: {
      original: [...array],
      bit: [...bit],
      size: n,
      activeIndices: [],
      queryRange: [qL, qR],
      updateIndex: null,
      updateValue: null,
      operation: "query",
      result: null,
      phase: "processing",
    },
    highlights: {},
    variables: { queryL: qL, queryR: qR },
  });

  // Compute prefixSum(qR)
  const visitedRight: number[] = [];
  let sumRight = 0;
  let idx = qR;
  while (idx > 0) {
    visitedRight.push(idx);
    sumRight += bit[idx];

    steps.push({
      description: `prefixSum(${qR}): at index ${idx}, add BIT[${idx}] = ${bit[idx]}. Running sum = ${sumRight}. Next: ${idx} − lowbit(${idx}) = ${idx - lowbit(idx)}.`,
      state: {
        original: [...array],
        bit: [...bit],
        size: n,
        activeIndices: [...visitedRight],
        queryRange: [qL, qR],
        updateIndex: null,
        updateValue: null,
        operation: "query",
        result: null,
        phase: "processing",
      },
      highlights: Object.fromEntries(visitedRight.map((v) => [v, "active"])),
      variables: { index: idx, "BIT[idx]": bit[idx], runningSum: sumRight, lowbit: lowbit(idx) },
    });

    idx -= lowbit(idx);
  }

  // Compute prefixSum(qL - 1)
  const visitedLeft: number[] = [];
  let sumLeft = 0;
  idx = qL - 1;

  if (idx > 0) {
    steps.push({
      description: `Now compute prefixSum(${qL - 1}) to get the range sum. Start with i = ${qL - 1}.`,
      state: {
        original: [...array],
        bit: [...bit],
        size: n,
        activeIndices: [],
        queryRange: [qL, qR],
        updateIndex: null,
        updateValue: null,
        operation: "query",
        result: null,
        phase: "processing",
      },
      highlights: {},
      variables: { queryL: qL, "qL-1": qL - 1 },
    });

    while (idx > 0) {
      visitedLeft.push(idx);
      sumLeft += bit[idx];

      steps.push({
        description: `prefixSum(${qL - 1}): at index ${idx}, add BIT[${idx}] = ${bit[idx]}. Running sum = ${sumLeft}. Next: ${idx} − lowbit(${idx}) = ${idx - lowbit(idx)}.`,
        state: {
          original: [...array],
          bit: [...bit],
          size: n,
          activeIndices: [...visitedLeft],
          queryRange: [qL, qR],
          updateIndex: null,
          updateValue: null,
          operation: "query",
          result: null,
          phase: "processing",
        },
        highlights: Object.fromEntries(visitedLeft.map((v) => [v, "compare"])),
        variables: { index: idx, "BIT[idx]": bit[idx], runningSum: sumLeft, lowbit: lowbit(idx) },
      });

      idx -= lowbit(idx);
    }
  }

  const rangeSum = sumRight - sumLeft;

  steps.push({
    description: `Range sum [${qL}, ${qR}] = prefixSum(${qR}) − prefixSum(${qL - 1}) = ${sumRight} − ${sumLeft} = ${rangeSum}. Verified: actual sum = ${array.slice(qL - 1, qR).join(" + ")} = ${array.slice(qL - 1, qR).reduce((a, b) => a + b, 0)}.`,
    state: {
      original: [...array],
      bit: [...bit],
      size: n,
      activeIndices: [...visitedRight, ...visitedLeft],
      queryRange: [qL, qR],
      updateIndex: null,
      updateValue: null,
      operation: "query",
      result: rangeSum,
      phase: "done",
    },
    highlights: Object.fromEntries([...visitedRight, ...visitedLeft].map((v) => [v, "found"])),
    variables: { prefixSumR: sumRight, prefixSumL: sumLeft, result: rangeSum },
  });

  // ── PHASE 3: Point update — add 2 to index 4 (1-indexed) ───────────────────

  const updatePos = 4; // 1-indexed
  const delta = 2;

  steps.push({
    description: `Update: add ${delta} to position ${updatePos} (1-indexed, i.e. array[${updatePos - 1}] = ${array[updatePos - 1]} → ${array[updatePos - 1] + delta}). Propagate through BIT indices using lowbit trick.`,
    state: {
      original: [...array],
      bit: [...bit],
      size: n,
      activeIndices: [],
      queryRange: null,
      updateIndex: updatePos,
      updateValue: delta,
      operation: "update",
      result: null,
      phase: "processing",
    },
    highlights: {},
    variables: { updateAt: updatePos, delta },
  });

  const updatePath: number[] = [];
  idx = updatePos;
  while (idx <= n) {
    updatePath.push(idx);
    idx += lowbit(idx);
  }

  steps.push({
    description: `Update path from index ${updatePos}: [${updatePath.join(" → ")}]. Each BIT cell on this path covers a range that includes position ${updatePos}.`,
    state: {
      original: [...array],
      bit: [...bit],
      size: n,
      activeIndices: [...updatePath],
      queryRange: null,
      updateIndex: updatePos,
      updateValue: delta,
      operation: "update",
      result: null,
      phase: "processing",
    },
    highlights: Object.fromEntries(updatePath.map((v) => [v, "active"])),
    variables: { updateAt: updatePos, delta },
  });

  idx = updatePos;
  while (idx <= n) {
    const before = bit[idx];
    bit[idx] += delta;

    steps.push({
      description: `BIT[${idx}] += ${delta}: ${before} → ${bit[idx]}. Next index: ${idx} + lowbit(${idx}) = ${idx + lowbit(idx)}.`,
      state: {
        original: [...array],
        bit: [...bit],
        size: n,
        activeIndices: [idx],
        queryRange: null,
        updateIndex: updatePos,
        updateValue: delta,
        operation: "update",
        result: null,
        phase: "processing",
      },
      highlights: { [idx]: "compare" },
      variables: { index: idx, before, after: bit[idx], delta, lowbit: lowbit(idx) },
    });

    idx += lowbit(idx);
  }

  // Update original to reflect the change
  const updatedOriginal = [...array];
  updatedOriginal[updatePos - 1] += delta;

  steps.push({
    description: `Update complete. array[${updatePos - 1}] is now ${updatedOriginal[updatePos - 1]}. Final BIT: [${bit.slice(1).join(", ")}]. All prefix sums covering index ${updatePos} have been incremented by ${delta}.`,
    state: {
      original: updatedOriginal,
      bit: [...bit],
      size: n,
      activeIndices: [...updatePath],
      queryRange: null,
      updateIndex: updatePos,
      updateValue: delta,
      operation: "update",
      result: delta,
      phase: "done",
    },
    highlights: Object.fromEntries(updatePath.map((v) => [v, "found"])),
    variables: { updateAt: updatePos, delta, "new value": updatedOriginal[updatePos - 1] },
  });

  return steps;
}

export const fenwickTree: AlgorithmDefinition<{ array: number[] }, FenwickTreeState> = {
  slug: "fenwick-tree",
  name: "Fenwick Tree (BIT)",
  category: "data-structure",
  difficulty: "advanced",
  tags: ["tree", "prefix-sum", "range-query", "point-update", "binary-indexed-tree"],
  summary: "A compact tree structure enabling O(log n) prefix sum queries and point updates using bitwise lowbit tricks.",
  description: `A **Fenwick Tree** (also called a Binary Indexed Tree or BIT) is an array-based data structure that supports two operations in O(log n) time:

1. **Prefix sum query** — sum of elements from index 1 to i
2. **Point update** — add a delta to a single element

The key insight is the **lowbit** function: \`lowbit(i) = i & (-i)\` isolates the least significant set bit of i. Each cell BIT[i] stores the sum of elements in the range \`(i − lowbit(i), i]\`. To query, subtract lowbit repeatedly. To update, add lowbit repeatedly. This halves the work at each step, giving O(log n) performance with O(n) space.`,
  realWorldUsage: [
    {
      system: "Competitive programming / Online judges",
      useCase: "Dynamic prefix sum / frequency tables",
      why: "Fenwick Trees are the go-to structure for problems requiring O(log n) prefix sums with point updates — inversions count, order statistics, 2D range queries.",
    },
    {
      system: "Apache Lucene / search engines",
      useCase: "Cumulative frequency tables for term statistics",
      why: "BITs appear in statistical ranking models where cumulative term frequencies need fast incremental updates as documents are indexed.",
    },
    {
      system: "Game engines",
      useCase: "Weighted random sampling",
      why: "A BIT can implement alias-method-like weighted sampling: query gives cumulative weight, update changes a weight, binary search on the BIT finds the sampled index — all in O(log n).",
    },
    {
      system: "Database systems",
      useCase: "Histogram maintenance",
      why: "Incrementally updated histograms (e.g. for query planning statistics) can be maintained with a BIT so range-bucket queries remain fast without rebuilding from scratch.",
    },
  ],
  complexity: {
    time: { best: "O(log n)", average: "O(log n)", worst: "O(log n)" },
    space: "O(n)",
    inPlace: false,
  },
  related: ["segment-tree", "sparse-table", "merge-sort"],
  implemented: true,
  defaultInput: { array: [3, 2, -1, 6, 5, 4, -3, 3] },
  generateSteps,
  code: {
    typescript: `class FenwickTree {
  private bit: number[];
  private n: number;

  constructor(n: number) {
    this.n = n;
    this.bit = new Array(n + 1).fill(0); // 1-indexed
  }

  // Add delta to position i (1-indexed)
  update(i: number, delta: number): void {
    for (; i <= this.n; i += i & -i)
      this.bit[i] += delta;
  }

  // Prefix sum [1, i] (1-indexed)
  query(i: number): number {
    let sum = 0;
    for (; i > 0; i -= i & -i)
      sum += this.bit[i];
    return sum;
  }

  // Range sum [l, r] (1-indexed)
  rangeQuery(l: number, r: number): number {
    return this.query(r) - this.query(l - 1);
  }
}

// Build from array
const arr = [3, 2, -1, 6, 5, 4, -3, 3];
const ft = new FenwickTree(arr.length);
arr.forEach((val, i) => ft.update(i + 1, val));

console.log(ft.rangeQuery(1, 5)); // 15
ft.update(4, 2);                  // arr[3] += 2
console.log(ft.rangeQuery(1, 5)); // 17`,

    go: `package main

import "fmt"

type FenwickTree struct {
	bit []int
	n   int
}

func NewFenwickTree(n int) *FenwickTree {
	return &FenwickTree{bit: make([]int, n+1), n: n}
}

func (ft *FenwickTree) Update(i, delta int) {
	for ; i <= ft.n; i += i & -i {
		ft.bit[i] += delta
	}
}

func (ft *FenwickTree) Query(i int) int {
	sum := 0
	for ; i > 0; i -= i & -i {
		sum += ft.bit[i]
	}
	return sum
}

func (ft *FenwickTree) RangeQuery(l, r int) int {
	return ft.Query(r) - ft.Query(l-1)
}

func main() {
	arr := []int{3, 2, -1, 6, 5, 4, -3, 3}
	ft := NewFenwickTree(len(arr))
	for i, v := range arr {
		ft.Update(i+1, v)
	}
	fmt.Println(ft.RangeQuery(1, 5)) // 15
	ft.Update(4, 2)
	fmt.Println(ft.RangeQuery(1, 5)) // 17
}`,

    rust: `struct FenwickTree {
    bit: Vec<i64>,
    n: usize,
}

impl FenwickTree {
    fn new(n: usize) -> Self {
        FenwickTree { bit: vec![0; n + 1], n }
    }

    fn update(&mut self, mut i: usize, delta: i64) {
        while i <= self.n {
            self.bit[i] += delta;
            i += i & i.wrapping_neg();
        }
    }

    fn query(&self, mut i: usize) -> i64 {
        let mut sum = 0;
        while i > 0 {
            sum += self.bit[i];
            i -= i & i.wrapping_neg();
        }
        sum
    }

    fn range_query(&self, l: usize, r: usize) -> i64 {
        self.query(r) - if l > 1 { self.query(l - 1) } else { 0 }
    }
}

fn main() {
    let arr = [3, 2, -1_i64, 6, 5, 4, -3, 3];
    let mut ft = FenwickTree::new(arr.len());
    for (i, &v) in arr.iter().enumerate() {
        ft.update(i + 1, v);
    }
    println!("{}", ft.range_query(1, 5)); // 15
    ft.update(4, 2);
    println!("{}", ft.range_query(1, 5)); // 17
}`,
  },
};
