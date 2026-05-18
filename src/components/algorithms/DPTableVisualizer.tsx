"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface DPTableState {
  rowLabels: string[];
  colLabels: string[];
  table: (number | null)[][];
  current: [number, number] | null;
  comparing: [number, number][];
  result: number | null;
  phase: string;
}

function cellClass(
  r: number, c: number,
  current: [number, number] | null,
  comparing: [number, number][],
  table: (number | null)[][]
) {
  if (current && current[0] === r && current[1] === c)
    return "bg-indigo-500/40 border-indigo-400 text-indigo-100 scale-110 z-10";
  if (comparing.some(([cr, cc]) => cr === r && cc === c))
    return "bg-amber-500/30 border-amber-500 text-amber-200";
  if (table[r]?.[c] !== null && table[r]?.[c] !== undefined)
    return "bg-emerald-900/30 border-emerald-800/60 text-emerald-300";
  return "bg-zinc-900 border-zinc-800 text-zinc-700";
}

export function DPTableVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { rowLabels, colLabels, table, current, comparing, result, phase } =
    step.state as unknown as DPTableState;

  const rows = table.length;
  const cols = table[0]?.length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Phase + result */}
      <div className="flex items-center gap-3 flex-wrap">
        {phase && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
            {phase}
          </span>
        )}
        {result !== null && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-semibold">
            Result: {result}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs font-mono">
          <thead>
            <tr>
              <th className="w-8 h-8" />
              {colLabels.map((label, c) => (
                <th key={c} className="w-10 h-8 text-center text-zinc-500 font-normal px-0.5">
                  {label || "ε"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                <td className="w-8 h-8 text-center text-zinc-500 pr-1">
                  {rowLabels[r] || "ε"}
                </td>
                {Array.from({ length: cols }, (_, c) => {
                  const val = table[r]?.[c];
                  return (
                    <td key={c} className="p-0.5">
                      <div className={`
                        w-9 h-9 flex items-center justify-center rounded border
                        transition-all duration-150 font-semibold relative
                        ${cellClass(r, c, current, comparing ?? [], table)}
                      `}>
                        {val !== null && val !== undefined ? val : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Computing",    cls: "bg-indigo-500/40 border-indigo-400" },
          { label: "Referencing",  cls: "bg-amber-500/30 border-amber-500" },
          { label: "Filled",       cls: "bg-emerald-900/30 border-emerald-800/60" },
          { label: "Empty",        cls: "bg-zinc-900 border-zinc-800" },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <div className={`w-3 h-3 rounded border ${cls}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
