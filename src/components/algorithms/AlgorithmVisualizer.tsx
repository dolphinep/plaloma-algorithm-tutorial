"use client";
import { useEffect, useState } from "react";
import { useVisualizerStore } from "@/lib/store/visualizer";
import { loadAlgorithmDefinition } from "@/lib/algorithms/registry";
import { StepControls } from "./StepControls";
import { BinarySearchVisualizer } from "./BinarySearchVisualizer";
import { BFSVisualizer, DFSVisualizer } from "./GridVisualizer";
import { SortingVisualizer } from "./SortingVisualizer";
import { LinearSearchVisualizer } from "./LinearSearchVisualizer";
import { FibDPVisualizer } from "./FibDPVisualizer";
import { SieveVisualizer } from "./SieveVisualizer";
import { CountingSortVisualizer } from "./CountingSortVisualizer";
import { WeightedGraphVisualizer } from "./WeightedGraphVisualizer";
import { KadaneVisualizer } from "./KadaneVisualizer";
import { DPTableVisualizer } from "./DPTableVisualizer";
import { CoinChangeVisualizer } from "./CoinChangeVisualizer";
import { TwoSumVisualizer } from "./TwoSumVisualizer";
import { GCDVisualizer } from "./GCDVisualizer";
import { JumpSearchVisualizer } from "./JumpSearchVisualizer";
import { SlidingWindowVisualizer } from "./SlidingWindowVisualizer";
import { LISVisualizer } from "./LISVisualizer";
import { StringMatchVisualizer } from "./StringMatchVisualizer";
import { DAGVisualizer } from "./DAGVisualizer";
import { LinkedListVisualizer } from "./LinkedListVisualizer";
import { UnionFindVisualizer } from "./UnionFindVisualizer";
import { HashTableVisualizer } from "./HashTableVisualizer";
import { AStarVisualizer } from "./AStarVisualizer";
import { BSTVisualizer } from "./BSTVisualizer";
import { BloomFilterVisualizer } from "./BloomFilterVisualizer";
import { FenwickTreeVisualizer } from "./FenwickTreeVisualizer";
import { TrieVisualizer } from "./TrieVisualizer";
import { SegmentTreeVisualizer } from "./SegmentTreeVisualizer";

const VISUALIZERS: Record<string, React.ComponentType> = {
  "binary-search":         BinarySearchVisualizer,
  "linear-search":         LinearSearchVisualizer,
  "bfs":                   BFSVisualizer,
  "dfs":                   DFSVisualizer,
  "bubble-sort":           SortingVisualizer,
  "selection-sort":        SortingVisualizer,
  "insertion-sort":        SortingVisualizer,
  "merge-sort":            SortingVisualizer,
  "quick-sort":            SortingVisualizer,
  "heap-sort":             SortingVisualizer,
  "radix-sort":            SortingVisualizer,
  "shell-sort":            SortingVisualizer,
  "bucket-sort":           SortingVisualizer,
  "cycle-sort":            SortingVisualizer,
  "counting-sort":         CountingSortVisualizer,
  "fibonacci-dp":          FibDPVisualizer,
  "sieve-of-eratosthenes": SieveVisualizer,
  "dijkstra":              WeightedGraphVisualizer,
  "bellman-ford":          WeightedGraphVisualizer,
  "prim-mst":              WeightedGraphVisualizer,
  "kadane":                KadaneVisualizer,
  "coin-change":           CoinChangeVisualizer,
  "lcs":                   DPTableVisualizer,
  "knapsack":              DPTableVisualizer,
  "edit-distance":         DPTableVisualizer,
  "matrix-chain":          DPTableVisualizer,
  "two-sum":               TwoSumVisualizer,
  "gcd-euclidean":         GCDVisualizer,
  "jump-search":           JumpSearchVisualizer,
  "sliding-window-max":    SlidingWindowVisualizer,
  "lis":                   LISVisualizer,
  "kmp":                   StringMatchVisualizer,
  "rabin-karp":            StringMatchVisualizer,
  "z-algorithm":           StringMatchVisualizer,
  "topological-sort":      DAGVisualizer,
  "floyd-cycle-detection": LinkedListVisualizer,
  "union-find":            UnionFindVisualizer,
  "hash-table":            HashTableVisualizer,
  "huffman-coding":        DPTableVisualizer,
  "a-star":                AStarVisualizer,
  "floyd-warshall":        DPTableVisualizer,
  "kruskal":               WeightedGraphVisualizer,
  "bst-insert-search":     BSTVisualizer,
  "trie":                  TrieVisualizer,
  "bloom-filter":          BloomFilterVisualizer,
  "fenwick-tree":          FenwickTreeVisualizer,
  "segment-tree":          SegmentTreeVisualizer,
  "tim-sort":              SortingVisualizer,
};

interface Props {
  slug: string;
}

export function AlgorithmVisualizer({ slug }: Props) {
  const { setSteps, steps, currentIndex, reset } = useVisualizerStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reset();

    loadAlgorithmDefinition(slug).then((definition) => {
      if (cancelled || !definition) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const generated = (definition as any).generateSteps((definition as any).defaultInput);
      setSteps(generated);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [slug, setSteps, reset]);

  const VisualizerComponent = VISUALIZERS[slug];
  const currentStep = steps[currentIndex];

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-10 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500 text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-zinc-400 animate-spin" />
          Generating steps…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step description */}
      {currentStep && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-300 leading-relaxed">{currentStep.description}</p>
        </div>
      )}

      {/* Visualization */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 min-h-48">
        {VisualizerComponent ? <VisualizerComponent /> : (
          <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
            Visualization coming soon
          </div>
        )}
      </div>

      {/* Controls */}
      <StepControls />
    </div>
  );
}
