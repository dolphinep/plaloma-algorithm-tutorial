import type { AlgorithmStep } from "@/types/algorithm";

export type BarState =
  | "default"
  | "comparing"
  | "swapping"
  | "sorted"
  | "pivot"
  | "active"
  | "range"
  | "left"
  | "right";

export interface SortingState {
  array: number[];
  states: BarState[];
  comparisons: number;
  swaps: number;
  pass?: number;
}

export interface SortingInput {
  array: number[];
}

export const DEFAULT_SORT_INPUT: SortingInput = {
  array: [38, 27, 43, 3, 9, 82, 10, 55],
};

export function snap(
  array: number[],
  states: BarState[],
  comparisons: number,
  swaps: number,
  description: string,
  pass?: number,
  variables?: Record<string, string | number>
): AlgorithmStep<SortingState> {
  return {
    description,
    state: { array: [...array], states: [...states], comparisons, swaps, pass },
    highlights: {},
    variables,
  };
}

export function allSorted(n: number): BarState[] {
  return Array<BarState>(n).fill("sorted");
}
