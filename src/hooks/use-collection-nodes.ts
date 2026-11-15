import { useMemo } from "react";

import { useFilesStore } from "@/stores/files/files-store";
import { usePublicCollectionsStore } from "@/stores/public/public-store";
import type { NodeMap } from "@/types/node.types";
import { makeNodeTree } from "@/utils/files.utils";
import { resolveFolderView } from "@/utils/folder-view.utils";

const EMPTY: NodeMap = {};

/**
 * The active collection's own nodes plus the public nodes of the collection
 * with the same name (case-insensitive), if there is one.
 */
export function useCollectionNodes() {
  const localName = useFilesStore(
    (state) =>
      state.collections.find((c) => c.id === state.activeCollection)?.name,
  );
  const local = useFilesStore(
    (state) =>
      state.collections.find((c) => c.id === state.activeCollection)?.nodes ??
      EMPTY,
  );
  const publicNodes = usePublicCollectionsStore(
    (state) =>
      state.collections.find(
        (c) => c.name.toLowerCase() === localName?.toLowerCase(),
      )?.nodes ?? null,
  );

  return { local, publicNodes };
}

/** The same nodes with their "children of" index, rebuilt only when they change. */
export function useNodeTrees() {
  const { local, publicNodes } = useCollectionNodes();

  const localTree = useMemo(() => makeNodeTree(local), [local]);
  const publicTree = useMemo(
    () => (publicNodes ? makeNodeTree(publicNodes) : null),
    [publicNodes],
  );

  return { localTree, publicTree };
}

/** What the file browser shows right now: local and public items merged. */
export function useFolderView() {
  const { localTree, publicTree } = useNodeTrees();
  const currentFolderId = useFilesStore((state) => state.currentFolderId);

  return useMemo(
    () => resolveFolderView(localTree, publicTree, currentFolderId),
    [localTree, publicTree, currentFolderId],
  );
}
