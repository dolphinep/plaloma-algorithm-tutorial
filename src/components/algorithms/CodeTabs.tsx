"use client";
import { useState } from "react";
import type { AlgorithmCode } from "@/types/algorithm";

const TABS: { key: keyof AlgorithmCode; label: string; color: string }[] = [
  { key: "typescript", label: "TypeScript", color: "text-blue-400" },
  { key: "go", label: "Go", color: "text-cyan-400" },
  { key: "rust", label: "Rust", color: "text-orange-400" },
];

interface Props {
  code: AlgorithmCode;
}

export function CodeTabs({ code }: Props) {
  const [active, setActive] = useState<keyof AlgorithmCode>("typescript");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code[active]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between bg-zinc-900 border-b border-zinc-800 px-4">
        <div className="flex">
          {TABS.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                active === key
                  ? `${color} border-current`
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code block */}
      <div className="bg-zinc-950 overflow-x-auto">
        <pre className="p-5 text-sm leading-relaxed font-mono text-zinc-300 whitespace-pre">
          {code[active]}
        </pre>
      </div>
    </div>
  );
}
