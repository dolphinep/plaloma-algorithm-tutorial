"use client";
import { create } from "zustand";
import type { AlgorithmStep } from "@/types/algorithm";

interface VisualizerState {
  steps: AlgorithmStep[];
  currentIndex: number;
  isPlaying: boolean;
  speed: number; // ms per step
  setSteps: (steps: AlgorithmStep[]) => void;
  play: () => void;
  pause: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpTo: (index: number) => void;
  setSpeed: (ms: number) => void;
  reset: () => void;
}

export const useVisualizerStore = create<VisualizerState>((set, get) => ({
  steps: [],
  currentIndex: 0,
  isPlaying: false,
  speed: 800,

  setSteps: (steps) => set({ steps, currentIndex: 0, isPlaying: false }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  stepForward: () => {
    const { currentIndex, steps, isPlaying } = get();
    if (currentIndex < steps.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    } else {
      set({ isPlaying: false });
    }
  },

  stepBackward: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) set({ currentIndex: currentIndex - 1 });
  },

  jumpTo: (index) => set({ currentIndex: index }),

  setSpeed: (ms) => set({ speed: ms }),

  reset: () => set({ currentIndex: 0, isPlaying: false }),
}));
