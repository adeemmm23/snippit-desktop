import {
  findFolderByNames,
  getAncestry,
  type NodeTree,
} from "./files.utils";

import { isFolder, type TreeItem } from "@/types/node.types";

export type FolderView = {
  /** The folder being shown. `null` is the root (also used when the stored id no longer exists). */
  currentId: string | null;
  /** Names from the root down to the current folder. */
  namePath: string[];
  /** Folders from the root down to the current folder, for headers and breadcrumbs. */
  ancestors: { id: string; name: string }[];
  /** The parent of the current folder in the same tree, `null` when it is the root. */
  parentId: string | null;
  /**
   * The local folder that matches the current one. `undefined` when the folder
   * only exists in the public collection; `{ id: null }` is the root.
   */
  local: { id: string | null } | undefined;
  /** What to show: local items and public items together, local ones winning on a name clash. */
  items: TreeItem[];
};

/**
 * Works out what the tree shows for a folder.
 *
 * The current folder can be a local one or a public one. Either way, its
 * counterpart in the other tree is found by name, and both lists are merged.
 * Names are only used for this matching; everything else goes by id.
 */
export const resolveFolderView = (
  local: NodeTree,
  publicTree: NodeTree | null,
  currentId: string | null,
): FolderView => {
  // Which tree does the current folder live in?
  let chain = currentId === null ? [] : getAncestry(local.nodes, currentId);
  let isLocal = true;

  if (currentId !== null && chain.length === 0 && publicTree) {
    chain = getAncestry(publicTree.nodes, currentId);
    isLocal = false;
  }

  const last = chain.at(-1);
  if (currentId !== null && (!last || !isFolder(last))) {
    // The id is stale (deleted, collection changed...): fall back to the root.
    chain = [];
    isLocal = true;
  }

  const folders = chain.filter(isFolder);
  const namePath = folders.map((folder) => folder.name);
  const current = folders.at(-1) ?? null;

  // The same place in each tree.
  const localId = isLocal ? (current?.id ?? null) : findFolderByNames(local, namePath);
  const publicId = !publicTree
    ? undefined
    : isLocal
      ? findFolderByNames(publicTree, namePath)
      : (current?.id ?? null);

  const items = new Map<string, TreeItem>();

  if (publicTree && publicId !== undefined) {
    for (const node of publicTree.children.get(publicId) ?? []) {
      items.set(`${node.type}:${node.name}`, { node, origin: "public" });
    }
  }

  if (localId !== undefined) {
    for (const node of local.children.get(localId) ?? []) {
      items.set(`${node.type}:${node.name}`, { node, origin: "local" });
    }
  }

  return {
    currentId: current?.id ?? null,
    namePath,
    ancestors: folders.map(({ id, name }) => ({ id, name })),
    parentId: folders.at(-2)?.id ?? null,
    local: localId === undefined ? undefined : { id: localId },
    items: [...items.values()],
  };
};
