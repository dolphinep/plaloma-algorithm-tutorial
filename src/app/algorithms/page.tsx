"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { algorithmRegistry, CATEGORIES, DIFFICULTIES } from "@/lib/algorithms/registry";
import { CategoryBadge, DifficultyBadge } from "@/components/ui/CategoryBadge";
import type { AlgorithmCategory, Difficulty } from "@/types/algorithm";

export default function AlgorithmsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AlgorithmCategory | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");

  const filtered = useMemo(() => {
    return algorithmRegistry.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags.some((t) => t.includes(q));
      const matchCat = category === "all" || a.category === category;
      const matchDiff = difficulty === "all" || a.difficulty === difficulty;
      return matchSearch && matchCat && matchDiff;
    });
  }, [search, category, difficulty]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">All Algorithms</h1>
        <p className="text-zinc-500">
          {algorithmRegistry.filter((a) => a.implemented).length} interactive ·{" "}
          {algorithmRegistry.length} total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Search algorithms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 text-sm"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as AlgorithmCategory | "all")}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-zinc-700 text-sm cursor-pointer"
        >
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty | "all")}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-zinc-700 text-sm cursor-pointer"
        >
          {DIFFICULTIES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      {(search || category !== "all" || difficulty !== "all") && (
        <p className="text-sm text-zinc-500">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">No algorithms match your filters.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((algo) => (
            <Link
              key={algo.slug}
              href={`/algorithms/${algo.slug}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-zinc-100 group-hover:text-white transition-colors">
                  {algo.name}
                </h2>
                {algo.implemented ? (
                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                    Live
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-600 border border-zinc-700">
                    Soon
                  </span>
                )}
              </div>

              <p className="text-sm text-zinc-500 leading-relaxed flex-1">{algo.summary}</p>

              <div className="flex flex-wrap gap-2">
                <CategoryBadge category={algo.category} />
                <DifficultyBadge difficulty={algo.difficulty} />
                <span className="text-xs text-zinc-600 font-mono self-center ml-auto">
                  {algo.complexity.time.average}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
