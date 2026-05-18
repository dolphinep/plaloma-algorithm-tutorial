import { notFound } from "next/navigation";
import Link from "next/link";
import { algorithmRegistry, loadAlgorithmDefinition } from "@/lib/algorithms/registry";
import { CategoryBadge, DifficultyBadge } from "@/components/ui/CategoryBadge";
import { ComplexityTable } from "@/components/algorithms/ComplexityTable";
import { CodeTabs } from "@/components/algorithms/CodeTabs";
import { AlgorithmVisualizer } from "@/components/algorithms/AlgorithmVisualizer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return algorithmRegistry.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const meta = algorithmRegistry.find((a) => a.slug === slug);
  if (!meta) return {};
  return {
    title: `${meta.name} — Agorithm`,
    description: meta.summary,
  };
}

export default async function AlgorithmPage({ params }: Props) {
  const { slug } = await params;
  const meta = algorithmRegistry.find((a) => a.slug === slug);
  if (!meta) notFound();

  const definition = await loadAlgorithmDefinition(slug);

  const relatedAlgos = meta.related
    .map((s) => algorithmRegistry.find((a) => a.slug === s))
    .filter(Boolean)
    .slice(0, 4);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/algorithms" className="hover:text-zinc-300 transition-colors">
          Algorithms
        </Link>
        <span>/</span>
        <span className="text-zinc-300">{meta.name}</span>
      </div>

      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          <CategoryBadge category={meta.category} />
          <DifficultyBadge difficulty={meta.difficulty} />
          {meta.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-4xl font-bold text-white">{meta.name}</h1>
        <p className="text-lg text-zinc-400 leading-relaxed">{meta.summary}</p>
      </header>

      {/* Description */}
      {definition?.description && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-white">How it works</h2>
          <div className="text-zinc-400 leading-relaxed prose-sm">
            {definition.description.split("\n\n").map((para, i) => (
              <p key={i} className="mb-3 last:mb-0">{para.replace(/\*\*/g, "")}</p>
            ))}
          </div>
        </section>
      )}

      {/* Complexity */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-white">Complexity</h2>
        <ComplexityTable complexity={meta.complexity} />
      </section>

      {/* Visualizer */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-white">Visualizer</h2>
        {meta.implemented ? (
          <AlgorithmVisualizer slug={slug} />
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-10 text-center text-zinc-600 text-sm">
            Interactive visualization coming soon for {meta.name}.
          </div>
        )}
      </section>

      {/* Real-world usage */}
      {(definition?.realWorldUsage ?? meta.realWorldUsage).length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-white">Where it&apos;s used in the real world</h2>
          <div className="flex flex-col gap-4">
            {(definition?.realWorldUsage ?? meta.realWorldUsage).map((usage) => (
              <div
                key={usage.system}
                className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-zinc-100">{usage.system}</h3>
                  <span className="text-xs text-zinc-500 shrink-0 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    {usage.useCase}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{usage.why}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Code */}
      {definition?.code && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-white">Implementation</h2>
          <CodeTabs code={definition.code} />
        </section>
      )}

      {/* Related */}
      {relatedAlgos.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-white">Related algorithms</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {relatedAlgos.map((related) => {
              if (!related) return null;
              return (
                <Link
                  key={related.slug}
                  href={`/algorithms/${related.slug}`}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-200 group-hover:text-white transition-colors text-sm">
                      {related.name}
                    </span>
                    {related.implemented && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{related.summary}</p>
                  <span className="text-xs font-mono text-zinc-600">{related.complexity.time.average}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
