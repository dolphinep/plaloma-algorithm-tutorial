"use client";
import { useEffect, useRef } from "react";
import { useVisualizerStore } from "@/lib/store/visualizer";

export function StepControls() {
  const { steps, currentIndex, isPlaying, speed, play, pause, stepForward, stepBackward, reset, setSpeed } =
    useVisualizerStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keyboard shortcuts — only fire when no text input is focused
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const { isPlaying, currentIndex, steps } = useVisualizerStore.getState();

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          if (isPlaying) useVisualizerStore.getState().pause();
          else if (currentIndex < steps.length - 1) useVisualizerStore.getState().play();
          break;
        case "ArrowRight":
        case "l":
          e.preventDefault();
          useVisualizerStore.getState().stepForward();
          break;
        case "ArrowLeft":
        case "j":
          e.preventDefault();
          useVisualizerStore.getState().stepBackward();
          break;
        case "r":
        case "0":
          e.preventDefault();
          useVisualizerStore.getState().reset();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const { currentIndex, steps } = useVisualizerStore.getState();
        if (currentIndex < steps.length - 1) {
          useVisualizerStore.getState().stepForward();
        } else {
          useVisualizerStore.getState().pause();
        }
      }, speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed]);

  const progress = steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Step counter */}
        <span className="text-xs text-zinc-500 tabular-nums w-20">
          Step {currentIndex + 1} / {steps.length}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Reset"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <button
            onClick={stepBackward}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous step"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={isPlaying ? pause : play}
            disabled={currentIndex === steps.length - 1 && !isPlaying}
            className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={stepForward}
            disabled={currentIndex === steps.length - 1}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next step"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6h2v12h-2z" />
            </svg>
          </button>
        </div>

        {/* Speed control */}
        <div className="flex items-center gap-2 w-32">
          <span className="text-xs text-zinc-500">Speed</span>
          <input
            type="range"
            min={100}
            max={1500}
            step={100}
            value={1600 - speed}
            onChange={(e) => setSpeed(1600 - Number(e.target.value))}
            className="flex-1 accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>
      {/* Keyboard hints */}
      <div className="flex gap-4 flex-wrap pt-1">
        {[
          { keys: ["Space", "K"], label: "Play / Pause" },
          { keys: ["←", "J"], label: "Prev step" },
          { keys: ["→", "L"], label: "Next step" },
          { keys: ["R"], label: "Reset" },
        ].map(({ keys, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-zinc-600">
            {keys.map((k) => (
              <kbd
                key={k}
                className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono text-[10px]"
              >
                {k}
              </kbd>
            ))}
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
