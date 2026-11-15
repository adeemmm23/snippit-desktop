import { Modifier } from "@dnd-kit/abstract";
import {
  Cursor,
  DragDropManager,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { FileEmpty01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";

import FolderHeader from "./folder-header";
import Node from "./node";

import { useFolderView, useNodeTrees } from "@/hooks/use-collection-nodes";
import { useLoadPublicCollections } from "@/hooks/use-load-public-collections";
import { useOpenFile } from "@/hooks/use-open-file";
import { useFilesStore } from "@/stores/files/files-store";
import { isFolder, type TreeItem } from "@/types/node.types";
import { ScrollArea } from "@/ui/scroll-area";
import { extractSubtree } from "@/utils/node-ops.utils";

const byName = (a: TreeItem, b: TreeItem) =>
  a.node.name.localeCompare(b.node.name);

export default function Tree() {
  useLoadPublicCollections();

  const view = useFolderView();
  const { publicTree } = useNodeTrees();
  const openFile = useOpenFile();

  const activeFileId = useFilesStore((state) => state.activeFileId);
  const setCurrentFolder = useFilesStore((state) => state.setCurrentFolder);
  const moveItem = useFilesStore((state) => state.moveItem);
  const addNodes = useFilesStore((state) => state.addNodes);
  const ensureFolderPath = useFilesStore((state) => state.ensureFolderPath);

  const folders = view.items.filter((i) => isFolder(i.node)).sort(byName);
  const files = view.items.filter((i) => !isFolder(i.node)).sort(byName);

  const manager = useMemo(
    () =>
      new DragDropManager({
        plugins: (defaults) => [
          ...defaults,
          Cursor.configure({ cursor: "cursor" }),
        ],
        modifiers: (defaults) => [...defaults, RelativePosition],
        sensors: (defaults) => [
          ...defaults,
          PointerSensor.configure({
            activationConstraints: [
              new PointerActivationConstraints.Distance({ value: 5 }),
            ],
          }),
        ],
      }),
    [],
  );

  // Copy a public item into the folder that matches the one being shown,
  // creating the local folders on the way if they don't exist yet.
  const download = (item: TreeItem) => {
    const parentId = view.local
      ? view.local.id
      : ensureFolderPath(view.namePath);

    if (publicTree) {
      addNodes(extractSubtree(publicTree.nodes, item.node.id), parentId);
    }
  };

  return (
    <DragDropProvider
      manager={manager}
      onDragEnd={(event) => {
        if (event.canceled) return;

        const { source, target } = event.operation;
        if (!source || !target || source.id === target.id) return;

        moveItem(String(source.id), target.data.folderId ?? null);
      }}
    >
      <div className="flex min-h-0 flex-1 grow flex-col">
        <FolderHeader />
        <ScrollArea className="size-full overflow-auto">
          <div className="flex h-full w-full flex-col gap-2 p-2">
            {[...folders, ...files].map((item) => (
              <Node
                key={`${item.origin}:${item.node.id}`}
                item={item}
                isActive={!isFolder(item.node) && activeFileId === item.node.id}
                onOpen={() =>
                  isFolder(item.node)
                    ? setCurrentFolder(item.node.id)
                    : openFile(item.node.id)
                }
                onDownload={() => download(item)}
              />
            ))}
            {view.items.length === 0 && (
              <div className="text-muted-foreground my-auto py-8 text-center">
                <div className="bg-muted mb-4 inline-flex items-center justify-center rounded-sm p-2">
                  <HugeiconsIcon icon={FileEmpty01Icon} className="size-5" />
                </div>
                <p className="text-sm">Folder is empty</p>
                <p className="mt-2 text-xs">Try adding some files</p>
              </div>
            )}
            <DragOverlay dropAnimation={null} className="size-fit!">
              {(source) =>
                source && (
                  <span className="bg-foreground/80 text-background pointer-events-none flex max-w-40 rounded-sm px-2 py-1">
                    <p className="truncate text-xs font-medium text-nowrap">
                      {source.data.name}
                    </p>
                  </span>
                )
              }
            </DragOverlay>
          </div>
        </ScrollArea>
      </div>
    </DragDropProvider>
  );
}

class RelativePosition extends Modifier {
  public apply(operation: DragDropManager["dragOperation"]) {
    const { shape, position, transform } = operation;

    const MARGIN = 15;

    if (!shape) {
      return transform;
    }

    const { x, y } = position.current;
    const { center } = shape.initial;

    return {
      x: x - center.x + MARGIN,
      y: y - center.y + MARGIN,
    };
  }
}
