import { readTextFile } from "@tauri-apps/plugin-fs";
import { create } from "zustand";

import useSettingsStore from "@/stores/settings/settings-store";
import type { NodeType } from "@/types/node.types";

export interface PublicCollection {
  id: string;
  name: string;
  files: NodeType[];
  sourcePath: string;
}

type PublicCollectionsState = {
  collections: PublicCollection[];
  isLoading: boolean;
  loadPublicCollections: () => Promise<void>;
};

export const usePublicCollectionsStore = create<PublicCollectionsState>(
  (set) => ({
    collections: [],
    isLoading: false,

    loadPublicCollections: async () => {
      set({ isLoading: true });
      const enabledPublicPaths = useSettingsStore.getState().publicCollections;

      const loadedCollections: PublicCollection[] = [];

      for (const filePath of enabledPublicPaths) {
        try {
          const content = await readTextFile(filePath);
          const parsed = JSON.parse(content);

          if (parsed && Array.isArray(parsed.files)) {
            const fileName =
              filePath.split(/[/\\]/).pop()?.replace(".json", "") ||
              "Collection";

            loadedCollections.push({
              id: `public_${filePath}`,
              name: parsed.name || fileName,
              files: parsed.files,
              sourcePath: filePath,
            });
          }
        } catch (err) {
          console.error(
            `Failed to load public collection from ${filePath}:`,
            err,
          );
        }
      }

      set({ collections: loadedCollections, isLoading: false });
    },
  }),
);
