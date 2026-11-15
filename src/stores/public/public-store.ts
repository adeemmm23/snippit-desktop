import { readTextFile } from "@tauri-apps/plugin-fs";
import { create } from "zustand";

import useSettingsStore from "@/stores/settings/settings-store";
import type { NodeMap } from "@/types/node.types";
import { fromTree, makePublicIdFactory } from "@/utils/files.utils";

/** A read-only set of nodes, matched to a local collection by name. */
export type PublicCollection = {
  name: string;
  nodes: NodeMap;
};

type PublicCollectionsState = {
  collections: PublicCollection[];
  loadPublicCollections: () => Promise<void>;
};

export const usePublicCollectionsStore = create<PublicCollectionsState>(
  (set) => ({
    collections: [],

    loadPublicCollections: async () => {
      const enabledPublicPaths = useSettingsStore.getState().publicCollections;

      const loadedCollections: PublicCollection[] = [];

      for (const filePath of enabledPublicPaths) {
        try {
          const parsed = JSON.parse(await readTextFile(filePath));

          if (parsed && Array.isArray(parsed.files)) {
            const fileName =
              filePath.split(/[/\\]/).pop()?.replace(".json", "") ||
              "Collection";

            loadedCollections.push({
              name: parsed.name || fileName,
              nodes: fromTree(parsed.files, makePublicIdFactory(filePath)),
            });
          }
        } catch (err) {
          console.error(
            `Failed to load public collection from ${filePath}:`,
            err,
          );
        }
      }

      set({ collections: loadedCollections });
    },
  }),
);
