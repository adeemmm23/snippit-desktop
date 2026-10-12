import type { StateCreator } from "zustand";

export type TimerSlice = {
  isTimerEnabled: boolean;
  timerDuration: number;
  setTimerEnabled: (enabled: boolean) => void;
  setTimerDuration: (duration: number) => void;
};

export const createTimerSlice: StateCreator<TimerSlice> = (set) => ({
  isTimerEnabled: false,
  timerDuration: 30,
  setTimerEnabled: (value) => set({ isTimerEnabled: value }),
  setTimerDuration: (timerDuration) => set({ timerDuration }),
});
