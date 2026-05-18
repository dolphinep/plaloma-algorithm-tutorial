export type AlgorithmCategory =
  | "sorting"
  | "searching"
  | "graph"
  | "tree"
  | "dynamic-programming"
  | "greedy"
  | "string"
  | "math"
  | "data-structure";

export interface ComplexityInfo {
  time: { best: string; average: string; worst: string };
  space: string;
  stable?: boolean;
  inPlace?: boolean;
  online?: boolean;
}

export interface RealWorldUsage {
  system: string;
  useCase: string;
  why: string;
}

export interface AlgorithmStep<TState = Record<string, unknown>> {
  description: string;
  state: TState;
  highlights: Record<string, "active" | "compare" | "found" | "sorted" | "pivot" | "visited" | "path">;
  variables?: Record<string, string | number | boolean>;
}

export interface AlgorithmCode {
  go: string;
  typescript: string;
  rust: string;
}

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface AlgorithmMeta {
  slug: string;
  name: string;
  category: AlgorithmCategory;
  difficulty: Difficulty;
  tags: string[];
  summary: string;
  description: string;
  realWorldUsage: RealWorldUsage[];
  complexity: ComplexityInfo;
  related: string[];
  implemented: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AlgorithmDefinition<TInput = any, TState = any>
  extends AlgorithmMeta {
  defaultInput: TInput;
  generateSteps: (input: TInput) => AlgorithmStep<TState>[];
  code: AlgorithmCode;
}
