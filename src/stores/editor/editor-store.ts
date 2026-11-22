import { create } from "zustand";

import { extractParts } from "./utils";

import type { LayoutEntry, Part } from "@/types/editor.types";

type EditorStore = {
  template: string;
  variables: Record<string, string>;
  parts: Part[];
  /** Ordered structure of the variables panel (plain variables and blocks) */
  layout: LayoutEntry[];
  /** How many times each repeated block is repeated, by block name */
  blockCounts: Record<string, number>;
  /** Mistakes found in the template syntax, ready to show */
  issues: string[];
  setTemplate: (template: string) => void;
  setVariable: (name: string, value: string) => void;
  resetVariables: () => void;
  addBlock: (name: string) => void;
  removeBlock: (name: string) => void;
};

export const useEditorStore = create<EditorStore>()((set, get) => ({
  template: "",
  variables: {},
  parts: [],
  layout: [],
  blockCounts: {},
  issues: [],
  setTemplate: (template) => {
    const { newVariables, newParts, newLayout, newBlockCounts, issues } =
      extractParts({
        template,
        variables: get().variables,
        blockCounts: get().blockCounts,
      });

    set({
      template,
      variables: newVariables,
      parts: newParts,
      layout: newLayout,
      blockCounts: newBlockCounts,
      issues,
    });
  },
  setVariable: (name, value) => {
    set((state) => ({
      variables: {
        ...state.variables,
        [name]: value,
      },
    }));

    // Refresh the template to update the variable values in the parts
    get().setTemplate(get().template);
  },
  resetVariables: () => {
    set((state) => {
      const newVariables: Record<string, string> = {};

      Object.keys(state.variables).forEach((key) => {
        newVariables[key] = "";
      });

      // Repeated blocks go back to a single instance
      return { variables: newVariables, blockCounts: {} };
    });

    // Same as above
    get().setTemplate(get().template);
  },
  addBlock: (name) => {
    const entry = get().layout.find(
      (item) => item.type === "block" && item.name === name,
    );

    if (entry?.type !== "block") {
      return;
    }

    set((state) => ({
      blockCounts: { ...state.blockCounts, [name]: entry.count + 1 },
    }));

    get().setTemplate(get().template);
  },
  removeBlock: (name) => {
    const entry = get().layout.find(
      (item) => item.type === "block" && item.name === name,
    );

    if (entry?.type !== "block" || entry.count <= 1) {
      return;
    }

    const variables = { ...get().variables };

    // Always removes the last instance
    entry.names.forEach((variable) => {
      delete variables[`${variable} ${entry.count}`];
    });

    set((state) => ({
      variables,
      blockCounts: { ...state.blockCounts, [name]: entry.count - 1 },
    }));

    get().setTemplate(get().template);
  },
}));
