import type { StateCreator } from "zustand";

export type PublicSlice = {
  publicFolders: string[];
  addPublicFolder: (folderPath: string) => void;
  removePublicFolder: (folderPath: string) => void;

  publicCollections: string[];
  addPublicCollection: (collectionId: string) => void;
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
    const trimmed = collectionPath?.trim();
    if (!trimmed) return;

    set((state) => ({
      publicCollections: state.publicCollections.includes(trimmed)
        ? state.publicCollections
        : [...state.publicCollections, trimmed],
    }));
  },
  removePublicCollection: (collectionId) =>
    set((state) => ({
      publicCollections: state.publicCollections.filter(
        (id) => id !== collectionId,
      ),
    })),
});
