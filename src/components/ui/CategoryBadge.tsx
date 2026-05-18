import type { AlgorithmCategory, Difficulty } from "@/types/algorithm";

const CATEGORY_COLORS: Record<AlgorithmCategory, string> = {
  searching: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  sorting: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  graph: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  tree: "bg-green-500/15 text-green-300 border-green-500/30",
  "dynamic-programming": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  greedy: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  string: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  math: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "data-structure": "bg-teal-500/15 text-teal-300 border-teal-500/30",
};

const CATEGORY_LABELS: Record<AlgorithmCategory, string> = {
  searching: "Searching",
  sorting: "Sorting",
  graph: "Graph",
  tree: "Tree",
  "dynamic-programming": "DP",
  greedy: "Greedy",
  string: "String",
  math: "Math",
  "data-structure": "Data Structure",
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  intermediate: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  advanced: "bg-red-500/15 text-red-300 border-red-500/30",
};

export function CategoryBadge({ category }: { category: AlgorithmCategory }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[category]}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${DIFFICULTY_COLORS[difficulty]}`}>
      {difficulty}
    </span>
  );
}
