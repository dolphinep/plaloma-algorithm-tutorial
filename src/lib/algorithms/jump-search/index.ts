import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ── Local state type ─────────────────────────────────────────────────────────
interface JumpSearchState {
  array: number[];
  target: number;
  blockSize: number;
  blockStart: number;
  blockEnd: number;
  current: number | null;
  found: number | null;
  phase: "jumping" | "linear" | "done";
}

// ── Input ────────────────────────────────────────────────────────────────────
interface JumpSearchInput {
  array: number[];
  target: number;
}

const DEFAULT_JUMP_SEARCH_INPUT: JumpSearchInput = {
  array: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 23, 29, 31, 37],
  target: 23,
};

// ── Step generator ───────────────────────────────────────────────────────────
function generateSteps(
  input: JumpSearchInput
): AlgorithmStep<JumpSearchState>[] {
  const { array, target } = input;
  const n = array.length;
  const blockSize = Math.floor(Math.sqrt(n));
  const steps: AlgorithmStep<JumpSearchState>[] = [];

  const snap = (
    description: string,
    blockStart: number,
    blockEnd: number,
    current: number | null,
    found: number | null,
    phase: "jumping" | "linear" | "done",
    extra?: Record<string, string | number>
  ): AlgorithmStep<JumpSearchState> => ({
    description,
    state: {
      array,
      target,
      blockSize,
      blockStart,
      blockEnd,
      current,
      found,
      phase,
    },
    highlights:
      found !== null
        ? { [found]: "found" }
        : current !== null
          ? { [current]: "compare" }
          : {},
    variables: { blockSize, blockStart, blockEnd, target, ...extra },
  });

  // Init step
  steps.push(
    snap(
      `Jump search for ${target} in sorted array of ${n} elements. Block size = ⌊√${n}⌋ = ${blockSize}.`,
      0,
      blockSize - 1,
      null,
      null,
      "jumping"
    )
  );

  // Jumping phase
  let blockStart = 0;
  let blockEnd = blockSize - 1;

  while (blockEnd < n && array[Math.min(blockEnd, n - 1)] < target) {
    const idx = Math.min(blockEnd, n - 1);
    const val = array[idx];

    steps.push(
      snap(
        `Jump to index ${idx}: arr[${idx}]=${val}. ${val < target ? `${val} < ${target} — too small, jump again.` : `${val} ≥ ${target} — overshoot! Start linear scan.`}`,
        blockStart,
        blockEnd,
        idx,
        null,
        "jumping",
        { "arr[current]": val }
      )
    );

    blockStart = blockEnd + 1;
    blockEnd += blockSize;
  }

  // Final jump step (overshoot or boundary)
  const jumpIdx = Math.min(blockEnd, n - 1);
  const jumpVal = array[jumpIdx];
  steps.push(
    snap(
      `Jump to index ${jumpIdx}: arr[${jumpIdx}]=${jumpVal}. ${jumpVal >= target ? `${jumpVal} ≥ ${target} — overshoot detected! Switch to linear scan in [${blockStart}..${jumpIdx}].` : `Reached end of array. Linear scan from ${blockStart}.`}`,
      blockStart,
      jumpIdx,
      jumpIdx,
      null,
      "jumping",
      { "arr[current]": jumpVal }
    )
  );

  // Clamp blockEnd for linear scan
  const linearEnd = Math.min(blockEnd, n - 1);

  // Linear scan phase
  for (let i = blockStart; i <= linearEnd; i++) {
    const val = array[i];

    if (val === target) {
      steps.push(
        snap(
          `Linear scan index ${i}: arr[${i}]=${val}. Found ${target}!`,
          blockStart,
          linearEnd,
          i,
          i,
          "done",
          { "arr[i]": val, result: i }
        )
      );
      return steps;
    }

    steps.push(
      snap(
        `Linear scan index ${i}: arr[${i}]=${val}. ${val === target ? "Found!" : val > target ? `${val} > ${target} — target not present.` : "Not here, continue."}`,
        blockStart,
        linearEnd,
        i,
        null,
        "linear",
        { "arr[i]": val }
      )
    );

    if (val > target) {
      steps.push(
        snap(
          `${val} > ${target} — ${target} is not in the array.`,
          blockStart,
          linearEnd,
          i,
          null,
          "done",
          { result: -1 }
        )
      );
      return steps;
    }
  }

  steps.push(
    snap(
      `${target} not found in array.`,
      blockStart,
      linearEnd,
      null,
      null,
      "done",
      { result: -1 }
    )
  );

  return steps;
}

// ── Export ───────────────────────────────────────────────────────────────────
export const jumpSearch: AlgorithmDefinition<
  JumpSearchInput,
  JumpSearchState
> = {
  slug: "jump-search",
  name: "Jump Search",
  category: "searching",
  difficulty: "intermediate",
  tags: ["sorted", "block", "square-root"],
  summary:
    "Search a sorted array by jumping ahead in fixed block steps, then performing a short linear scan.",

  description: `Jump Search is a block-based algorithm for sorted arrays that balances the simplicity of linear search with the efficiency of binary search. It divides the array into blocks of size ⌊√n⌋ and jumps forward by that step until the current element equals or exceeds the target, then performs a short backward linear scan within the identified block.

The optimal block size is ⌊√n⌋, which yields a worst-case O(√n) complexity — the same for both the jumping and linear phases. Unlike binary search, jump search moves in only one direction (forward), which makes it well-suited for media where backward seeks are expensive, such as magnetic disks or tape drives.

**Phase 1 — Jumping:** advance blockEnd by blockSize until arr[blockEnd] ≥ target or end of array is reached.

**Phase 2 — Linear scan:** search element-by-element from blockStart to min(blockEnd, n-1) for the exact target value.`,

  realWorldUsage: [
    {
      system: "Ordered disk block search",
      useCase: "Locating a record in a sequentially ordered file on disk",
      why: "Disk seek time is asymmetric — seeking backward is more expensive than seeking forward. Jump search's unidirectional nature minimises costly backward seeks while still outperforming a full linear scan by a factor of √n.",
    },
    {
      system: "Database B-tree sequential scan fallback",
      useCase:
        "Range scan within a leaf page after initial binary descent",
      why: "After a B-tree traversal lands on a leaf page, the engine may use a jump-style scan to quickly skip over large runs of non-matching records before switching to element-by-element inspection near the target range boundary.",
    },
    {
      system: "Sensor data stream searching",
      useCase:
        "Finding threshold crossings in a monotonically recorded sensor log",
      why: "IoT and telemetry systems often store timestamped sensor readings in append-only sorted buffers. Jump search quickly identifies the block containing a threshold crossing and pins down the exact crossing point with a local scan.",
    },
  ],

  complexity: {
    time: { best: "O(1)", average: "O(√n)", worst: "O(√n)" },
    space: "O(1)",
    inPlace: true,
  },

  related: ["binary-search", "linear-search"],
  implemented: true,
  defaultInput: DEFAULT_JUMP_SEARCH_INPUT,
  generateSteps,

  code: {
    typescript: `function jumpSearch(arr: number[], target: number): number {
  const n = arr.length;
  const blockSize = Math.floor(Math.sqrt(n));

  let blockStart = 0;
  let blockEnd = blockSize - 1;

  // Phase 1: jump forward until overshoot or end of array
  while (blockEnd < n && arr[Math.min(blockEnd, n - 1)] < target) {
    blockStart = blockEnd + 1;
    blockEnd += blockSize;
  }

  // Phase 2: linear scan within the identified block
  const end = Math.min(blockEnd, n - 1);
  for (let i = blockStart; i <= end; i++) {
    if (arr[i] === target) return i;
    if (arr[i] > target) break;
  }

  return -1; // not found
}

// Usage — array must be sorted
const sorted = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 23, 29, 31, 37];
console.log(jumpSearch(sorted, 23)); // 10
console.log(jumpSearch(sorted, 20)); // -1`,

    go: `package main

import (
	"fmt"
	"math"
)

func jumpSearch(arr []int, target int) int {
	n := len(arr)
	blockSize := int(math.Sqrt(float64(n)))

	blockStart := 0
	blockEnd := blockSize - 1

	// Phase 1: jump forward
	for blockEnd < n && arr[min(blockEnd, n-1)] < target {
		blockStart = blockEnd + 1
		blockEnd += blockSize
	}

	// Phase 2: linear scan
	end := min(blockEnd, n-1)
	for i := blockStart; i <= end; i++ {
		if arr[i] == target {
			return i
		}
		if arr[i] > target {
			break
		}
	}

	return -1
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func main() {
	sorted := []int{1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 23, 29, 31, 37}
	fmt.Println(jumpSearch(sorted, 23)) // 10
	fmt.Println(jumpSearch(sorted, 20)) // -1
}`,

    rust: `fn jump_search(arr: &[i32], target: i32) -> Option<usize> {
    let n = arr.len();
    let block_size = (n as f64).sqrt() as usize;

    let mut block_start = 0;
    let mut block_end = block_size.saturating_sub(1);

    // Phase 1: jump forward
    while block_end < n && arr[block_end.min(n - 1)] < target {
        block_start = block_end + 1;
        block_end += block_size;
    }

    // Phase 2: linear scan
    let end = block_end.min(n - 1);
    for i in block_start..=end {
        if arr[i] == target {
            return Some(i);
        }
        if arr[i] > target {
            break;
        }
    }

    None
}

fn main() {
    let sorted = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 23, 29, 31, 37];
    println!("{:?}", jump_search(&sorted, 23)); // Some(10)
    println!("{:?}", jump_search(&sorted, 20)); // None
}`,
  },
};
