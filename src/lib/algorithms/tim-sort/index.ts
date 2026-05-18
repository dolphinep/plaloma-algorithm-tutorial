import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";
import {
  SortingInput,
  SortingState,
  BarState,
  snap,
  allSorted,
} from "../sorting-utils";

// ─── Default input ─────────────────────────────────────────────────────────────
// 12 elements chosen to produce visible natural runs and interesting merges

const DEFAULT_INPUT: SortingInput = {
  array: [15, 3, 29, 7, 12, 3, 38, 18, 6, 22, 11, 45],
};

// ─── Tim Sort constants ────────────────────────────────────────────────────────

const MIN_RUN = 4; // small so the demo stays tractable with 12 elements

// ─── Step generator ───────────────────────────────────────────────────────────

function generateSteps(
  input: SortingInput
): AlgorithmStep<SortingState>[] {
  const arr = [...input.array];
  const n = arr.length;
  const steps: AlgorithmStep<SortingState>[] = [];
  let comparisons = 0;
  let swaps = 0;

  // ── Initial state ───────────────────────────────────────────────────────────
  steps.push(
    snap(
      arr,
      Array<BarState>(n).fill("default"),
      comparisons,
      swaps,
      `Starting Tim Sort on ${n} elements. minRun=${MIN_RUN}. ` +
        "Phase 1: identify runs and sort each with insertion sort. Phase 2: merge runs."
    )
  );

  // ─── Phase 1: Insertion-sort each run of length MIN_RUN ────────────────────

  const runs: Array<[number, number]> = []; // [start, end] inclusive

  for (let runStart = 0; runStart < n; runStart += MIN_RUN) {
    const runEnd = Math.min(runStart + MIN_RUN - 1, n - 1);
    runs.push([runStart, runEnd]);

    // Highlight the upcoming run
    const markStates: BarState[] = Array<BarState>(n).fill("default");
    for (let k = runStart; k <= runEnd; k++) markStates[k] = "range";

    steps.push(
      snap(
        arr,
        markStates,
        comparisons,
        swaps,
        `Run ${runs.length}: indices [${runStart}..${runEnd}]. Apply insertion sort.`,
        runs.length,
        { runStart, runEnd }
      )
    );

    // Insertion sort on arr[runStart..runEnd]
    for (let i = runStart + 1; i <= runEnd; i++) {
      const key = arr[i];
      let j = i - 1;

      // Show the element being inserted
      const insertStates: BarState[] = Array<BarState>(n).fill("default");
      for (let k = runStart; k <= runEnd; k++) insertStates[k] = "range";
      insertStates[i] = "pivot";

      steps.push(
        snap(
          arr,
          insertStates,
          comparisons,
          swaps,
          `Inserting ${key} into sorted portion [${runStart}..${i - 1}].`,
          undefined,
          { key, i, j }
        )
      );

      while (j >= runStart && arr[j] > key) {
        // Compare
        const cmpStates: BarState[] = Array<BarState>(n).fill("default");
        for (let k = runStart; k <= runEnd; k++) cmpStates[k] = "range";
        cmpStates[j] = "comparing";
        cmpStates[j + 1] = "comparing";
        comparisons++;

        steps.push(
          snap(
            arr,
            cmpStates,
            comparisons,
            swaps,
            `Compare ${arr[j]} > ${key} → shift ${arr[j]} right.`,
            undefined,
            { "arr[j]": arr[j], key, j }
          )
        );

        // Shift right
        arr[j + 1] = arr[j];
        swaps++;
        j--;
      }
      arr[j + 1] = key;

      // Show state after insertion
      const afterStates: BarState[] = Array<BarState>(n).fill("default");
      for (let k = runStart; k <= runEnd; k++) afterStates[k] = "range";
      if (j + 1 !== i) {
        for (let k = runStart; k <= i; k++) afterStates[k] = "sorted";
      } else {
        // No shift happened — still mark the sorted portion
        for (let k = runStart; k <= i; k++) afterStates[k] = "sorted";
      }

      steps.push(
        snap(
          arr,
          afterStates,
          comparisons,
          swaps,
          `Placed ${key} at index ${j + 1}. [${runStart}..${i}] is sorted.`,
          undefined,
          { placed: key, at: j + 1 }
        )
      );
    }

    // Mark entire run as sorted after insertion sort completes
    const runSortedStates: BarState[] = Array<BarState>(n).fill("default");
    for (let k = runStart; k <= runEnd; k++) runSortedStates[k] = "sorted";

    steps.push(
      snap(
        arr,
        runSortedStates,
        comparisons,
        swaps,
        `Run ${runs.length} [${runStart}..${runEnd}] = [${arr.slice(runStart, runEnd + 1).join(", ")}] fully sorted.`,
        runs.length,
        { runStart, runEnd }
      )
    );
  }

  // ─── Phase 2: Merge runs ────────────────────────────────────────────────────

  steps.push(
    snap(
      arr,
      Array<BarState>(n).fill("default"),
      comparisons,
      swaps,
      `Phase 2: Merge ${runs.length} sorted run(s) using bottom-up merge. Current runs: ` +
        runs.map(([s, e]) => `[${s}..${e}]`).join(", ") + "."
    )
  );

  // Bottom-up merge: double the merge width each pass (like merge sort)
  for (let width = MIN_RUN; width < n; width *= 2) {
    for (let left = 0; left < n; left += 2 * width) {
      const mid = Math.min(left + width - 1, n - 1);
      const right = Math.min(left + 2 * width - 1, n - 1);

      if (mid >= right) continue; // single run, nothing to merge

      // Highlight the two halves about to be merged
      const mergeMarkStates: BarState[] = Array<BarState>(n).fill("default");
      for (let k = left; k <= mid; k++) mergeMarkStates[k] = "left";
      for (let k = mid + 1; k <= right; k++) mergeMarkStates[k] = "right";

      steps.push(
        snap(
          arr,
          mergeMarkStates,
          comparisons,
          swaps,
          `Merge [${left}..${mid}] (left) with [${mid + 1}..${right}] (right).`,
          undefined,
          { left, mid, right, width }
        )
      );

      // Two-pointer merge into temp buffer
      const temp: number[] = [];
      let i = left;
      let j = mid + 1;

      while (i <= mid && j <= right) {
        const cmpStates: BarState[] = Array<BarState>(n).fill("default");
        for (let k = left; k <= right; k++) cmpStates[k] = "range";
        cmpStates[i] = "comparing";
        cmpStates[j] = "comparing";
        comparisons++;

        const smaller = arr[i] <= arr[j] ? arr[i] : arr[j];
        steps.push(
          snap(
            arr,
            cmpStates,
            comparisons,
            swaps,
            `Compare arr[${i}]=${arr[i]} vs arr[${j}]=${arr[j]} → take ${smaller}.`,
            undefined,
            { "arr[i]": arr[i], "arr[j]": arr[j], i, j }
          )
        );

        if (arr[i] <= arr[j]) {
          temp.push(arr[i]);
          i++;
        } else {
          temp.push(arr[j]);
          j++;
        }
      }

      while (i <= mid) { temp.push(arr[i]); i++; }
      while (j <= right) { temp.push(arr[j]); j++; }

      // Copy merged result back
      for (let k = 0; k < temp.length; k++) {
        arr[left + k] = temp[k];
        swaps++;
      }

      const isFinalMerge = width * 2 >= n;
      const afterMergeStates: BarState[] = Array<BarState>(n).fill("default");
      if (isFinalMerge) {
        for (let k = left; k <= right; k++) afterMergeStates[k] = "sorted";
      } else {
        for (let k = left; k <= right; k++) afterMergeStates[k] = "default";
      }

      steps.push(
        snap(
          arr,
          afterMergeStates,
          comparisons,
          swaps,
          isFinalMerge
            ? `Merged [${left}..${right}] into final order: [${arr.slice(left, right + 1).join(", ")}].`
            : `Merged [${left}..${right}] into sorted subarray.`,
          undefined,
          { left, right }
        )
      );
    }
  }

  // ── Final sorted state ──────────────────────────────────────────────────────
  steps.push(
    snap(
      arr,
      allSorted(n),
      comparisons,
      swaps,
      `Tim Sort complete. Array: [${arr.join(", ")}]. Comparisons: ${comparisons}, writes: ${swaps}.`,
      undefined,
      { comparisons, writes: swaps }
    )
  );

  return steps;
}

// ─── Algorithm definition ─────────────────────────────────────────────────────

export const timSort: AlgorithmDefinition<SortingInput, SortingState> = {
  slug: "tim-sort",
  name: "Tim Sort",
  category: "sorting",
  difficulty: "advanced",
  tags: ["hybrid", "stable", "adaptive", "merge-sort", "insertion-sort"],
  summary: "Hybrid of merge sort and insertion sort — the algorithm powering Python's sorted(), Java's Arrays.sort(), and V8's Array.prototype.sort().",

  description: `Timsort is a **hybrid sorting algorithm** developed by Tim Peters in 2002 for CPython. It combines the strengths of **insertion sort** (excellent for small or nearly-sorted arrays) with **merge sort** (reliable O(n log n) for large inputs) and exploits the natural order already present in real-world data.

The algorithm works in two phases. In **Phase 1**, the input is divided into fixed-length chunks called *runs* (size \`minRun\`, typically 32–64 in production). Each run is sorted in place using insertion sort, which is cache-friendly and fast on small arrays. If a natural ascending or descending run longer than \`minRun\` is found, it is used directly (descending runs are reversed); this is the *adaptive* property that gives Timsort O(n) best-case performance on already-sorted data.

In **Phase 2**, sorted runs are merged using a bottom-up approach similar to merge sort. Timsort maintains a stack of runs and applies merge rules (the *galloping* optimisation and *run length invariants*) to ensure runs of similar size are merged first, keeping the merge tree balanced and the total work at O(n log n). The merge step is stable — equal elements from the left run always precede those from the right — which is why Timsort is the default sort in Python, Java (objects), and JavaScript (V8).`,

  realWorldUsage: [
    {
      system: "CPython — built-in sorted() and list.sort()",
      useCase: "General-purpose stable sort for all Python lists",
      why: "Tim Peters designed Timsort specifically for CPython after observing that real-world data often contains partially sorted sequences. Its adaptive behaviour makes it significantly faster than pure merge sort on such inputs, while its O(n log n) guarantee keeps it safe for adversarial data.",
    },
    {
      system: "Java — Arrays.sort(Object[]) and Collections.sort()",
      useCase: "Sorting object arrays and collections",
      why: "Java 7 replaced the older merge sort in Arrays.sort for objects with Timsort. The stability guarantee is critical: sorting a table by column B and then by column A must preserve the B-order for ties in A — only a stable algorithm guarantees this without extra bookkeeping.",
    },
    {
      system: "V8 JavaScript engine — Array.prototype.sort()",
      useCase: "Default array sorting in Node.js and Chrome",
      why: "V8 switched from quicksort to Timsort in 2019 (Node.js ≥ 12 / Chrome 70) to comply with the ECMAScript spec requirement for a stable sort. The real-world speed advantage on partially ordered data (e.g. DOM node lists, already-sorted API responses) made it the natural choice.",
    },
  ],

  complexity: {
    time: { best: "O(n)", average: "O(n log n)", worst: "O(n log n)" },
    space: "O(n)",
    stable: true,
    inPlace: false,
  },

  related: ["merge-sort", "insertion-sort"],
  implemented: true,
  defaultInput: DEFAULT_INPUT,
  generateSteps,

  code: {
    typescript: `const MIN_RUN = 32;

// Insertion sort in place on arr[left..right]
function insertionSort(arr: number[], left: number, right: number): void {
  for (let i = left + 1; i <= right; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= left && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
}

// Merge arr[left..mid] with arr[mid+1..right] in place (using temp buffer)
function merge(arr: number[], left: number, mid: number, right: number): void {
  const leftPart  = arr.slice(left, mid + 1);
  const rightPart = arr.slice(mid + 1, right + 1);
  let i = 0, j = 0, k = left;
  while (i < leftPart.length && j < rightPart.length) {
    arr[k++] = leftPart[i] <= rightPart[j] ? leftPart[i++] : rightPart[j++];
  }
  while (i < leftPart.length)  arr[k++] = leftPart[i++];
  while (j < rightPart.length) arr[k++] = rightPart[j++];
}

export function timSort(arr: number[]): number[] {
  const a = [...arr];
  const n = a.length;

  // Phase 1: sort each run with insertion sort
  for (let i = 0; i < n; i += MIN_RUN) {
    insertionSort(a, i, Math.min(i + MIN_RUN - 1, n - 1));
  }

  // Phase 2: merge runs bottom-up
  for (let width = MIN_RUN; width < n; width *= 2) {
    for (let left = 0; left < n; left += 2 * width) {
      const mid   = Math.min(left + width - 1, n - 1);
      const right = Math.min(left + 2 * width - 1, n - 1);
      if (mid < right) merge(a, left, mid, right);
    }
  }

  return a;
}

// Usage
console.log(timSort([15, 3, 29, 7, 12, 3, 38, 18, 6, 22, 11, 45]));
// [3, 3, 6, 7, 11, 12, 15, 18, 22, 29, 38, 45]`,

    go: `package main

import "fmt"

const minRun = 32

func insertionSort(arr []int, left, right int) {
	for i := left + 1; i <= right; i++ {
		key, j := arr[i], i-1
		for j >= left && arr[j] > key {
			arr[j+1] = arr[j]
			j--
		}
		arr[j+1] = key
	}
}

func merge(arr []int, left, mid, right int) {
	l := append([]int{}, arr[left:mid+1]...)
	r := append([]int{}, arr[mid+1:right+1]...)
	i, j, k := 0, 0, left
	for i < len(l) && j < len(r) {
		if l[i] <= r[j] {
			arr[k] = l[i]; i++
		} else {
			arr[k] = r[j]; j++
		}
		k++
	}
	for i < len(l) { arr[k] = l[i]; i++; k++ }
	for j < len(r) { arr[k] = r[j]; j++; k++ }
}

func timSort(arr []int) {
	n := len(arr)
	for i := 0; i < n; i += minRun {
		end := i + minRun - 1
		if end >= n { end = n - 1 }
		insertionSort(arr, i, end)
	}
	for width := minRun; width < n; width *= 2 {
		for left := 0; left < n; left += 2 * width {
			mid   := left + width - 1;  if mid >= n { mid = n - 1 }
			right := left + 2*width - 1; if right >= n { right = n - 1 }
			if mid < right { merge(arr, left, mid, right) }
		}
	}
}

func main() {
	arr := []int{15, 3, 29, 7, 12, 3, 38, 18, 6, 22, 11, 45}
	timSort(arr)
	fmt.Println(arr) // [3 3 6 7 11 12 15 18 22 29 38 45]
}`,

    rust: `const MIN_RUN: usize = 32;

fn insertion_sort(arr: &mut [i32], left: usize, right: usize) {
    for i in (left + 1)..=right {
        let key = arr[i];
        let mut j = i;
        while j > left && arr[j - 1] > key {
            arr[j] = arr[j - 1];
            j -= 1;
        }
        arr[j] = key;
    }
}

fn merge(arr: &mut [i32], left: usize, mid: usize, right: usize) {
    let left_part  = arr[left..=mid].to_vec();
    let right_part = arr[mid + 1..=right].to_vec();
    let (mut i, mut j, mut k) = (0, 0, left);
    while i < left_part.len() && j < right_part.len() {
        if left_part[i] <= right_part[j] { arr[k] = left_part[i];  i += 1; }
        else                             { arr[k] = right_part[j]; j += 1; }
        k += 1;
    }
    while i < left_part.len()  { arr[k] = left_part[i];  i += 1; k += 1; }
    while j < right_part.len() { arr[k] = right_part[j]; j += 1; k += 1; }
}

fn tim_sort(arr: &mut [i32]) {
    let n = arr.len();
    let mut i = 0;
    while i < n {
        let end = (i + MIN_RUN - 1).min(n - 1);
        insertion_sort(arr, i, end);
        i += MIN_RUN;
    }
    let mut width = MIN_RUN;
    while width < n {
        let mut left = 0;
        while left < n {
            let mid   = (left + width - 1).min(n - 1);
            let right = (left + 2 * width - 1).min(n - 1);
            if mid < right { merge(arr, left, mid, right); }
            left += 2 * width;
        }
        width *= 2;
    }
}

fn main() {
    let mut arr = [15, 3, 29, 7, 12, 3, 38, 18, 6, 22, 11, 45];
    tim_sort(&mut arr);
    println!("{:?}", arr); // [3, 3, 6, 7, 11, 12, 15, 18, 22, 29, 38, 45]
}`,
  },
};
