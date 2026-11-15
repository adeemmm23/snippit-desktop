import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useEditorStore } from "../editor/editor-store";
import { createFsStorage } from "../storage";

import {
  isFile,
  type Collection,
  type NodeMap,
  type NodeType,
} from "@/types/node.types";
import { fromTree, generateId, isPublicId } from "@/utils/files.utils";
import {
  attachNodes,
  createNode,
  ensureFolderPath as ensureFolderPathIn,
  moveNode,
  removeNode,
  renameNode,
} from "@/utils/node-ops.utils";

const MAX_OPENED_FILES = 100;

export type SaveResult = "saved" | "no-file" | "read-only";

export type OpenedFile = { id: string; count: number; openedAt: number };

/** Use as the fallback in selectors, so "no history" is always the same array. */
export const NO_OPENED_FILES: OpenedFile[] = [];

type FilesStore = {
  collections: Collection[];
  activeCollection: string;
  /** Id of the file open in the editor, `null` for none. */
  activeFileId: string | null;
  /** Id of the folder being browsed, `null` for the collection root. */
  currentFolderId: string | null;
  /** Open history per collection id, so switching collections doesn't lose it. */
  openedFiles: Record<string, OpenedFile[]>;

  setActiveCollection: (id: string) => void;
  /** Returns the new collection's id, or `null` if the name is already used. */
  createCollection: (name: string, nodes?: NodeMap) => string | null;
  deleteCollection: (id: string) => void;
  renameCollection: (id: string, name: string) => void;

  setActiveFile: (id: string | null) => void;
  setCurrentFolder: (id: string | null) => void;

  /**
   * Copies a stand-alone map of nodes (from `fromTree` or `extractSubtree`)
   * into a folder, with new ids. `null` parent = root.
   */
  addNodes: (
    incoming: NodeMap,
    parentId: string | null,
    collectionId?: string,
  ) => boolean;
  /**
   * Writes the editor's text into the open file.
   * `"read-only"` means the open file is a public one, which can't be saved.
   */
  saveActiveFile: () => SaveResult;
  /** Returns the new item's id, or `null` if the parent doesn't exist or isn't a folder. */
  createItem: (
    parentId: string | null,
    type: NodeType["type"],
    name: string,
    collectionId?: string,
    content?: string,
  ) => string | null;
  removeItem: (id: string) => void;
  /** Moves an item into another folder (`null` = root). */
  moveItem: (id: string, targetParentId: string | null) => void;
  renameItem: (id: string, name: string) => void;
  /** Makes sure a folder path exists in the collection and returns the last folder's id. */
  ensureFolderPath: (names: string[], collectionId?: string) => string | null;
};

const initialCollection: Collection = {
  id: "0",
  name: "Default",
  nodes: {},
  updatedAt: Date.now(),
  createdAt: Date.now(),
};

/** What is reset when you switch collection. The open history is not part of it. */
const emptyNavigation = {
  activeFileId: null,
  currentFolderId: null,
};

export const useFilesStore = create<FilesStore>()(
  persist(
    (set, get) => {
      /**
       * Applies `change` to a collection's nodes and stores the result, unless
       * `change` returns `null` (the request didn't make sense).
       */
      const updateNodes = (
        collectionId: string | undefined,
        change: (nodes: NodeMap) => NodeMap | null,
      ): boolean => {
        const { collections, activeCollection } = get();
        const targetId = collectionId ?? activeCollection;

        const collection = collections.find((c) => c.id === targetId);
        if (!collection) return false;

        const nodes = change(collection.nodes);
        if (!nodes) return false;

        const now = Date.now();
        set({
          collections: collections.map((c) =>
            c.id === targetId ? { ...c, nodes, updatedAt: now } : c,
          ),
        });
        return true;
      };

      return {
        collections: [initialCollection],
        activeCollection: "0",
        ...emptyNavigation,
        openedFiles: {},

        setActiveCollection: (id) => {
          const { collections } = get();

          if (!collections.some((collection) => collection.id === id)) return;

          useEditorStore.getState().setTemplate("");
          set({ activeCollection: id, ...emptyNavigation });
        },

        createCollection: (name, nodes) => {
          const { collections } = get();

          if (collections.some((collection) => collection.name === name)) {
            return null;
          }

          const id = generateId();
          const now = Date.now();

          set({
            collections: [
              ...collections,
              {
                id,
                name,
                nodes: nodes ?? {},
                updatedAt: now,
                createdAt: now,
              },
            ],
            activeCollection: id,
            ...emptyNavigation,
          });
          useEditorStore.getState().setTemplate("");

          return id;
        },

        deleteCollection: (id) => {
          const { collections, activeCollection, openedFiles } = get();
          const { setTemplate } = useEditorStore.getState();

          const remaining = collections.filter((c) => c.id !== id);
          const updated =
            remaining.length > 0 ? remaining : [initialCollection];

          // Drop this collection's open history
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _removed, ...updatedOpenedFiles } = openedFiles;

          if (activeCollection === id) {
            setTemplate("");
            set({
              collections: updated,
              openedFiles: updatedOpenedFiles,
              activeCollection: updated[0].id,
              ...emptyNavigation,
            });
          } else {
            set({ collections: updated, openedFiles: updatedOpenedFiles });
          }
        },

        renameCollection: (id, name) => {
          const now = Date.now();

          set({
            collections: get().collections.map((collection) =>
              collection.id === id
                ? { ...collection, name, updatedAt: now }
                : collection,
            ),
          });
        },

        setActiveFile: (id) => {
          if (id === null) {
            set({ activeFileId: null });
            return;
          }

          const now = Date.now();
          const { openedFiles, activeCollection } = get();
          const history = openedFiles[activeCollection] ?? NO_OPENED_FILES;
          const existing = history.find((file) => file.id === id);

          const next = existing
            ? history.map((file) =>
                file.id === id
                  ? { ...file, count: file.count + 1, openedAt: now }
                  : file,
              )
            : [...history, { id, count: 1, openedAt: now }];

          set({
            activeFileId: id,
            openedFiles: {
              ...openedFiles,
              // Keep the history from growing forever: drop the least recently opened.
              [activeCollection]:
                next.length > MAX_OPENED_FILES
                  ? [...next]
                      .sort((a, b) => b.openedAt - a.openedAt)
                      .slice(0, MAX_OPENED_FILES)
                  : next,
            },
          });
        },

        setCurrentFolder: (id) => set({ currentFolderId: id }),

        addNodes: (incoming, parentId, collectionId) =>
          updateNodes(collectionId, (nodes) =>
            attachNodes(nodes, parentId, incoming),
          ),

        saveActiveFile: () => {
          const { activeFileId } = get();
          if (activeFileId === null) return "no-file";

          const { template } = useEditorStore.getState();

          const now = Date.now();

          const saved = updateNodes(undefined, (nodes) => {
            const file = nodes[activeFileId];
            if (!file || !isFile(file)) return null;

            return {
              ...nodes,
              [file.id]: {
                ...file,
                content: template,
                updatedAt: now,
              },
            };
          });

          if (saved) return "saved";

          // The id is not in the local collection: either a public file, or a stale id.
          return isPublicId(activeFileId) ? "read-only" : "no-file";
        },

        createItem: (parentId, type, name, collectionId, content) => {
          let id = null as string | null;

          updateNodes(collectionId, (nodes) => {
            const created = createNode(nodes, parentId, type, name, content);
            id = created?.id ?? null;
            return created?.nodes ?? null;
          });

          return id;
        },

        removeItem: (id) => {
          const before = get();
          const parentId =
            before.collections.find((c) => c.id === before.activeCollection)
              ?.nodes[id]?.parentId ?? null;

          let removedIds = null as Set<string> | null;

          updateNodes(undefined, (nodes) => {
            const result = removeNode(nodes, id);
            removedIds = result?.removed ?? null;
            return result?.nodes ?? null;
          });

          if (!removedIds) return;
          const removed: Set<string> = removedIds;

          const {
            activeFileId,
            currentFolderId,
            openedFiles,
            activeCollection,
          } = get();
          const activeRemoved =
            activeFileId !== null && removed.has(activeFileId);

          set({
            activeFileId: activeRemoved ? null : activeFileId,
            // If we were browsing inside what got deleted, step out to its parent.
            currentFolderId:
              currentFolderId !== null && removed.has(currentFolderId)
                ? parentId
                : currentFolderId,
            openedFiles: {
              ...openedFiles,
              [activeCollection]: (
                openedFiles[activeCollection] ?? NO_OPENED_FILES
              ).filter((file) => !removed.has(file.id)),
            },
          });

          if (activeRemoved) useEditorStore.getState().setTemplate("");
        },

        moveItem: (id, targetParentId) => {
          updateNodes(undefined, (nodes) =>
            moveNode(nodes, id, targetParentId),
          );
        },

        renameItem: (id, name) => {
          updateNodes(undefined, (nodes) => renameNode(nodes, id, name));
        },

        ensureFolderPath: (names, collectionId) => {
          let id = null as string | null;

          updateNodes(collectionId, (nodes) => {
            const result = ensureFolderPathIn(nodes, names);
            id = result.id;
            return result.changed ? result.nodes : null;
          });

          return id;
        },
      };
    },
    {
      name: "files",
      version: 3,
      storage: createFsStorage<FilesStore>(),
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<FilesStore>;
        const now = Date.now();

        const collections: Collection[] = (
          (state.collections ?? []) as (Partial<Collection> & {
            files?: unknown;
          })[]
        )
          .filter((c) => typeof c?.name === "string")
          .map((c) => ({
            id: c.id || generateId(),
            name: c.name!,
            nodes: fromTree(c.files, generateId),
            createdAt: now,
            updatedAt: now,
          }));
        const safe = collections.length > 0 ? collections : [initialCollection];

        return {
          ...state,
          collections: safe,
          activeCollection: safe.some((c) => c.id === state.activeCollection)
            ? state.activeCollection
            : safe[0].id,
          ...emptyNavigation,
          openedFiles: {},
        } as FilesStore;
      },
    },
  ),
);
