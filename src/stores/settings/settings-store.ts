import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";

import { fsStorage } from "../storage";
import { createHelpersSlice } from "./slices/helper-slice";
import { createTooltipsSlice } from "./slices/tooltips-slice";
import { createVariableSlice } from "./slices/variable-slice";

const settingsSlices = [
  createVariableSlice,
  createTooltipsSlice,
  createHelpersSlice,
] as const;

type UnionToIntersection<T> = (
  T extends unknown ? (arg: T) => void : never
) extends (arg: infer I) => void
  ? I
  : never;

type SettingsStore = UnionToIntersection<
  ReturnType<(typeof settingsSlices)[number]>
>;

const useSettingsStore = create<SettingsStore>()(
  subscribeWithSelector(
    persist(
      (...args) =>
        Object.assign(
          {},
          ...settingsSlices.map((createSlice) => createSlice(...args)),
        ),
      { name: "settings", storage: createJSONStorage(() => fsStorage) },
    ),
  ),
);

export default useSettingsStore;
