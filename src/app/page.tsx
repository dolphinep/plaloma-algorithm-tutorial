import Link from "next/link";
import { algorithmRegistry, CATEGORIES } from "@/lib/algorithms/registry";
import { CategoryBadge, DifficultyBadge } from "@/components/ui/CategoryBadge";

const FEATURED_SLUGS = ["binary-search", "merge-sort", "dijkstra", "fibonacci-dp", "quick-sort", "bfs"];

const USE_CASES = [
  {
    system: "PostgreSQL",
    cases: [
      { description: "B-tree index scan", slug: "binary-search" },
      { description: "Sort result sets", slug: "merge-sort" },
      { description: "Full-text index", slug: "trie" },
    ],
  },
  {
    system: "MongoDB",
    cases: [
      { description: "Document key lookup", slug: "hash-table" },
      { description: "Text search index", slug: "trie" },
      { description: "Aggregation sort", slug: "merge-sort" },
    ],
  },
  {
    system: "Redis",
    cases: [
      { description: "O(1) key/value store", slug: "hash-table" },
      { description: "Membership test", slug: "bloom-filter" },
    ],
  },
  {
    system: "Git",
    cases: [
      { description: "git bisect bug hunt", slug: "binary-search" },
      { description: "git diff / merge", slug: "lcs" },
    ],
  },
  {
    system: "Google Maps",
    cases: [
      { description: "Shortest route", slug: "dijkstra" },
      { description: "Turn-by-turn navigation", slug: "a-star" },
    ],
  },
  {
    system: "npm / bundlers",
    cases: [
      { description: "Install order resolution", slug: "topological-sort" },
      { description: "Tree-shaking dead code", slug: "dfs" },
    ],
  },
  {
    system: "File compression",
    cases: [
      { description: "GZIP / ZIP encoding", slug: "huffman-coding" },
      { description: "Delta / diff compression", slug: "lcs" },
    ],
  },
  {
    system: "Network routing",
    cases: [
      { description: "BGP path propagation", slug: "bellman-ford" },
      { description: "Spanning tree protocol", slug: "kruskal" },
    ],
  },
];

export default function HomePage() {
  const featured = FEATURED_SLUGS.map((s) => algorithmRegistry.find((a) => a.slug === s)).filter(Boolean);
  const totalImplemented = algorithmRegistry.filter((a) => a.implemented).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col gap-20">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-6 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          {totalImplemented} algorithm{totalImplemented !== 1 ? "s" : ""} interactive · {algorithmRegistry.length} total
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white max-w-2xl leading-tight">
          Understand algorithms,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            step by step
          </span>
        </h1>

        <p className="text-lg text-zinc-400 max-w-xl">
          Interactive visualizations, real-world usage context, and code examples in Go, TypeScript, and Rust.
        </p>

        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/algorithms"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors text-sm"
          >
            Browse all algorithms
          </Link>
          <Link
            href="/algorithms/binary-search"
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium transition-colors text-sm border border-zinc-700"
          >
            Try Binary Search →
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Algorithms", value: algorithmRegistry.length },
          { label: "Categories", value: CATEGORIES.length - 1 },
          { label: "Languages", value: 3 },
          { label: "Interactive", value: totalImplemented },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-center">
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="text-sm text-zinc-500 mt-1">{label}</div>
          </div>
        ))}
      </section>

      {/* Featured */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Featured algorithms</h2>
          <Link href="/algorithms" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            View all →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map((algo) => {
            if (!algo) return null;
            return (
              <Link
                key={algo.slug}
                href={`/algorithms/${algo.slug}`}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-zinc-100 group-hover:text-white transition-colors">
                    {algo.name}
                  </h3>
                  {algo.implemented && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">{algo.summary}</p>
                <div className="flex flex-wrap gap-2 mt-auto pt-2">
                  <CategoryBadge category={algo.category} />
                  <DifficultyBadge difficulty={algo.difficulty} />
                  <span className="text-xs text-zinc-600 font-mono self-center ml-auto">
                    {algo.complexity.time.average}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Real-world use cases */}
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Real-world use cases</h2>
          <p className="text-sm text-zinc-500 mt-1">Where these algorithms actually run in production systems.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {USE_CASES.map(({ system, cases }) => (
            <div key={system} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 flex flex-col gap-3">
              <span className="self-start text-xs font-mono px-2 py-0.5 rounded border border-zinc-700 text-zinc-400">
                {system}
              </span>
              <ul className="flex flex-col gap-2.5">
                {cases.map(({ description, slug }) => {
                  const algo = algorithmRegistry.find((a) => a.slug === slug);
                  return (
                    <li key={`${system}-${slug}`} className="flex items-start gap-2 text-sm">
                      <span className="text-zinc-600 mt-0.5 shrink-0">→</span>
                      <div>
                        <span className="text-zinc-400 leading-snug">{description}</span>
                        <Link
                          href={`/algorithms/${slug}`}
                          className="block text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-0.5"
                        >
                          {algo?.name ?? slug}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="flex flex-col gap-8">
        <h2 className="text-xl font-semibold text-white">Everything you need to understand an algorithm</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "▶", title: "Step-by-step animation", desc: "Play, pause, step forward/back. Control the speed. Watch variables update in real time." },
            { icon: "⬡", title: "Real-world context", desc: "Where is this actually used? PostgreSQL B-tree indexes, git bisect, Linux kernel — not just textbook examples." },
            { icon: "{}", title: "Code in 3 languages", desc: "Production-quality implementations in TypeScript, Go, and Rust — with idiomatic patterns for each." },
            { icon: "O()", title: "Complexity analysis", desc: "Best, average, worst-case time and space complexity with color-coded ratings." },
            { icon: "↔", title: "Algorithm properties", desc: "Is it stable? In-place? Online? Everything you need to know before picking the right tool." },
            { icon: "→", title: "Related algorithms", desc: "Natural learning paths. See what to explore next based on what you just learned." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col gap-2">
              <div className="text-2xl font-mono text-indigo-400">{icon}</div>
              <h3 className="font-semibold text-zinc-100">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
