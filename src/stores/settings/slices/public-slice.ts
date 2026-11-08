import type { StateCreator } from "zustand";

import { useFilesStore } from "@/stores/files/files-store";

export type PublicSlice = {
  publicFolders: string[];
  addPublicFolder: (folderPath: string) => void;
  removePublicFolder: (folderPath: string) => void;

  publicCollections: string[];
  addPublicCollection: (collectionId: string) => boolean;
  removePublicCollection: (collectionId: string) => void;
};

export const createPublicSlice: StateCreator<PublicSlice> = (set) => ({
  publicFolders: [],
  addPublicFolder: (folderPath) => {
    const trimmed = folderPath?.trim();
    if (!trimmed) return;

    set((state) => ({
      publicFolders: state.publicFolders.includes(trimmed)
        ? state.publicFolders
        : [...state.publicFolders, trimmed],
    }));
  },
  removePublicFolder: (folderPath) =>
    set((state) => ({
      publicFolders: state.publicFolders.filter((path) => path !== folderPath),
    })),
  publicCollections: [],
  addPublicCollection: (collectionPath) => {
    // This is needed because to use public collection you need to have a created collection that has the same name; empty or not
    const isThereCollection = useFilesStore.getState().collections.some(
      (c) =>
        c.name.toLowerCase() ===
        collectionPath
          ?.trim()
          .split(/[/\\]/)
          .pop()
          ?.replace(/\.json$/i, "")
          ?.toLowerCase(),
    );

    if (!isThereCollection) {
      useFilesStore.getState().createCollection(
        collectionPath
          ?.trim()
          .split(/[/\\]/)
          .pop()
          ?.replace(/\.json$/i, "") || "",
      );
    }

    const trimmed = collectionPath?.trim();
    if (!trimmed) return false;

    const getCollectionName = (p: string) =>
      p
        .split(/[/\\]/)
        .pop()
        ?.replace(/\.json$/i, "")
        .toLowerCase() || "";

    const newName = getCollectionName(trimmed);
    let duplicateRemoved = false;

    set((state) => {
      const filtered = state.publicCollections.filter((p) => {
        const matches = getCollectionName(p) === newName;
        if (matches) duplicateRemoved = true;
        return !matches;
      });

      return {
        publicCollections: [...filtered, trimmed],
      };
    });

    return duplicateRemoved;
  },
  removePublicCollection: (collectionPath) => {
    const isThereCollection = useFilesStore.getState().collections.some(
      (c) =>
        c.name.toLowerCase() ===
        collectionPath
          ?.trim()
          .split(/[/\\]/)
          .pop()
          ?.replace(/\.json$/i, "")
          ?.toLowerCase(),
    );

    // check if collection has files
    if (isThereCollection) {
      const collection = useFilesStore.getState().collections.find(
        (c) =>
          c.name.toLowerCase() ===
          collectionPath
            ?.trim()
            .split(/[/\\]/)
            .pop()
            ?.replace(/\.json$/i, "")
            ?.toLowerCase(),
      );

      const hasFiles = (collection?.files.length ?? 0) > 0;

      if (!hasFiles) {
        useFilesStore.getState().deleteCollection(collection?.id || "");
      }
    }

    set((state) => ({
      publicCollections: state.publicCollections.filter(
        (path) => path !== collectionPath,
      ),
    }));
  },
});
