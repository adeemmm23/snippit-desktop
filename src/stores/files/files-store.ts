import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  deepClone,
  getAvailableName,
  getChildren,
  isDeepEqual,
  remapPath,
  startsWithPath,
} from "./utils";
import { useEditorStore } from "../editor/editor-store";
import { createFsStorage } from "../storage";

import {
  isFile,
  isFolder,
  type Collection,
  type NodeType,
} from "@/types/node.types";
import {
  assignMissingIds,
  generateId,
  getNodeContent,
  getOrCreateNodeContent,
} from "@/utils/files.utils";

type FilesStore = {
  collections: Collection[];
  activeCollection: string;
  activeFile: string[];
  currenFolder: string[];
  openedFiles: { path: string[]; count: number; openedAt: number }[];
  setFiles: (files: NodeType[]) => void;
  setActiveCollection: (id: string) => void;
  createCollection: (name: string, files?: NodeType[]) => void;
  deleteCollection: (id: string) => void;
  renameCollection: (id: string, name: string) => void;
  setActiveFile: (path: string[]) => void;
  setCurrentFolder: (path: string[]) => void;
  addFiles: (
    files: NodeType[],
    path: string[],
    selectedCollection?: string,
  ) => void;
  saveActiveFile: () => boolean;
  createItem: (
    path: string[],
    type: "file" | "folder",
    selectedCollection?: string,
    content?: string,
    nodes?: NodeType[],
  ) => void;
  removeItem: (path: string[]) => void;
  moveItem: (oldPath: string[], newPath: string[]) => void;
  renameItem: (path: string[], name: string) => void;
  ensureIds: () => number;
};

const initialCollection: Collection = {
  id: "0",
  name: "Default",
  files: [],
};

export const useFilesStore = create<FilesStore>()(
  persist(
    (set, get) => ({
      collections: [initialCollection],
      activeCollection: "0",
      activeFile: [],
      currenFolder: [],
      openedFiles: [],
      setFiles: (files) => {
        const { activeCollection, collections } = get();

        const updatedCollections = collections.map((collection) => {
          if (collection.id === activeCollection) {
            return { ...collection, files };
          }
          return collection;
        });

        set({ collections: updatedCollections });
      },
      setActiveCollection: (id) => {
        const { collections } = get();
        const { setTemplate } = useEditorStore.getState();

        if (!collections.some((collection) => collection.id === id)) {
          return;
        }

        setTemplate("");

        set({
          activeCollection: id,
          activeFile: [],
          currenFolder: [],
          openedFiles: [],
        });
      },
      createCollection: (name, files) => {
        const { collections } = get();

        if (collections.some((collection) => collection.name === name)) {
          return;
        }

        const id = generateId();
        const now = new Date().toISOString();

        const newCollection = {
          id,
          name,
          files: files || [],
          updatedAt: now,
          createdAt: now,
        };

        set({
          collections: [...collections, newCollection],
          activeCollection: id,
        });
      },
      deleteCollection: (id) => {
        const { collections, activeCollection } = get();
        const { setTemplate } = useEditorStore.getState();

        if (activeCollection === id) {
          setTemplate("");
        }

        const filteredCollections = collections.filter(
          (collection) => collection.id !== id,
        );

        const updatedCollections =
          filteredCollections.length > 0
            ? filteredCollections
            : [initialCollection];

        set({
          collections: updatedCollections,
          activeCollection:
            activeCollection === id
              ? updatedCollections[0].id
              : activeCollection,
          ...(activeCollection === id && {
            activeFile: [],
            currenFolder: [],
            openedFiles: [],
          }),
        });
      },
      renameCollection: (id, newName) => {
        const { collections } = get();

        const now = new Date().toISOString();

        const updatedCollections = collections.map((collection) =>
          collection.id === id
            ? { ...collection, name: newName, updatedAt: now }
            : collection,
        );

        set({
          collections: updatedCollections,
        });
      },
      setActiveFile: (activeFilePath) => {
        const { openedFiles } = get();

        const newOpenedFiles = deepClone(openedFiles);

        const existingFile = newOpenedFiles.find((file) =>
          isDeepEqual(file.path, activeFilePath),
        );

        if (existingFile) {
          existingFile.count += 1;
          existingFile.openedAt = Date.now();
        } else {
          newOpenedFiles.push({
            path: activeFilePath,
            count: 1,
            openedAt: Date.now(),
          });
        }

        set({
          activeFile: activeFilePath,
          openedFiles: newOpenedFiles,
        });
      },
      setCurrentFolder: (currentWorkingFolder) => {
        set({ currenFolder: currentWorkingFolder });
      },
      addFiles: (newFiles, path, selecteCollection) => {
        const { collections, activeCollection } = get();

        const files =
          collections.find(
            (collection) =>
              collection.id === (selecteCollection ?? activeCollection),
          )?.files || [];

        const updatedFiles = deepClone(files);

        const node = getNodeContent(path, updatedFiles);

        if (node && isFolder(node)) {
          node.files.push(...newFiles);
        } else {
          updatedFiles.push(...newFiles);
        }

        const updatedCollections = collections.map((collection) => {
          if (collection.id === (selecteCollection ?? activeCollection)) {
            return { ...collection, files: updatedFiles };
          }
          return collection;
        });

        set({ collections: updatedCollections });
      },
      saveActiveFile: () => {
        const { activeFile, collections, activeCollection } = get();
        const { template } = useEditorStore.getState();

        const files =
          collections.find((collection) => collection.id === activeCollection)
            ?.files || [];

        if (activeFile.length === 0) return false;

        const newFiles = deepClone(files);

        const node = getNodeContent(activeFile, newFiles);

        if (!node || !isFile(node)) {
          return false;
        }

        node.content = template;

        const updatedCollections = collections.map((collection) => {
          if (collection.id === activeCollection) {
            return { ...collection, files: newFiles };
          }
          return collection;
        });

        set({ collections: updatedCollections });
        return true;
      },
      createItem: (path, type, selecteCollection, content, nodes) => {
        const { collections, activeCollection } = get();
        const files =
          collections.find(
            (c) => c.id === (selecteCollection ?? activeCollection),
          )?.files || [];

        console.log("createItem", path, type, content, selecteCollection);
        const newFiles = deepClone(files);
        const name = path[path.length - 1];

        const node = getOrCreateNodeContent(path.slice(0, -1), newFiles);
        const parent = node && isFolder(node) ? node.files : newFiles;

        const finalName = getAvailableName(parent, name);

        const id = generateId();

        let newNode: NodeType;

        if (type === "file") {
          newNode = {
            id,
            type: "file",
            name: finalName,
            content: content || "",
          };
        } else {
          newNode = {
            id,
            type: "folder",
            name: finalName,
            files: nodes ?? [],
          };
        }

        parent.push(newNode);

        const updatedCollections = collections.map((collection) => {
          if (collection.id === (selecteCollection ?? activeCollection)) {
            return { ...collection, files: newFiles };
          }
          return collection;
        });

        set({ collections: updatedCollections });
      },
      removeItem: (path) => {
        const { activeCollection, collections, openedFiles } = get();
        const files =
          collections.find((c) => c.id === activeCollection)?.files || [];
        const newFiles = deepClone(files);
        const node = getNodeContent(path.slice(0, -1), newFiles);
        const parent = node && isFolder(node) ? node.files : newFiles;

        if (!parent) {
          return;
        }

        const itemName = path[path.length - 1];
        const itemIndex = parent.findIndex(
          (item: NodeType) => item.name === itemName,
        );

        if (itemIndex === -1) {
          return;
        }

        parent.splice(itemIndex, 1);

        const newOpenedFiles = openedFiles.filter((file) => {
          if (isDeepEqual(file.path, path)) {
            return false;
          }

          if (file.path.length < path.length) {
            return true;
          }

          for (let i = 0; i < path.length; i++) {
            if (file.path[i] !== path[i]) {
              return true;
            }
          }

          return false;
        });

        const updatedCollections = collections.map((collection) => {
          if (collection.id === activeCollection) {
            return { ...collection, files: newFiles };
          }
          return collection;
        });
        set({ collections: updatedCollections, openedFiles: newOpenedFiles });
      },
      moveItem: (oldPath, newPath) => {
        const {
          activeCollection,
          collections,
          activeFile,
          currenFolder,
          openedFiles,
        } = get();

        if (oldPath.length === 0 || newPath.length === 0) return;

        const newParentPath = newPath.slice(0, -1);
        if (startsWithPath(newParentPath, oldPath)) return;

        const files =
          collections.find((collection) => collection.id === activeCollection)
            ?.files ?? [];
        const newFiles = deepClone(files);

        const oldParent = getChildren(newFiles, oldPath.slice(0, -1));
        const newParent = getChildren(newFiles, newParentPath);
        if (!oldParent || !newParent) return;

        const item = oldParent.find(
          (node) => node.name === oldPath[oldPath.length - 1],
        );
        if (!item) return;

        const finalName = getAvailableName(
          newParent.filter((node) => node !== item),
          newPath[newPath.length - 1],
        );

        if (oldParent === newParent && finalName === item.name) return;

        item.name = finalName;
        if (oldParent !== newParent) {
          oldParent.splice(oldParent.indexOf(item), 1);
          newParent.push(item);
        }

        const resolvedPath = [...newParentPath, finalName];
        const remap = (path: string[]) =>
          remapPath(path, oldPath, resolvedPath);

        set({
          collections: collections.map((collection) =>
            collection.id === activeCollection
              ? { ...collection, files: newFiles }
              : collection,
          ),
          activeFile: remap(activeFile),
          currenFolder: remap(currenFolder),
          openedFiles: openedFiles.map((file) => ({
            ...file,
            path: remap(file.path),
          })),
        });
      },
      renameItem: (path, newName) => {
        const name = newName.trim();
        if (!name) return;

        get().moveItem(path, [...path.slice(0, -1), name]);
      },
      ensureIds: () => {
        const { collections, activeCollection } = get();
        let total = 0;

        const updated = collections.map((collection) => {
          const { nodes, count } = assignMissingIds(collection.files);
          total += count;

          let id = collection.id;
          if (!id) {
            id = generateId();
            total++;
          }
          return { ...collection, id, files: nodes };
        });

        if (total === 0) return 0;

        set({
          collections: updated,
          // if the active collection was the one without an id, fall back to the first
          activeCollection: updated.some((c) => c.id === activeCollection)
            ? activeCollection
            : updated[0].id,
        });
        return total;
      },
    }),
    {
      name: "files",
      storage: createFsStorage<FilesStore>(),
    },
  ),
);
