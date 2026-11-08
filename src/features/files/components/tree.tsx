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
import { useEffect } from "react";

import FolderHeader from "./folder-header";
import Node from "./node";

import { useEditorStore } from "@/stores/editor/editor-store";
import { useFilesStore } from "@/stores/files/files-store";
import { usePublicCollectionsStore } from "@/stores/public/public-store";
import { isFile, isFolder, type NodeType } from "@/types/node.types";
import { ScrollArea } from "@/ui/scroll-area";
import { getNodeContent } from "@/utils/files.utils";

function markAsPublic(nodes: NodeType[]): NodeType[] {
  return nodes.map((node) => {
    if (node.type === "folder") {
      return {
        ...node,
        isPublic: true,
        files: markAsPublic(node.files),
      };
    }
    return {
      ...node,
      isPublic: true,
    };
  });
}

export default function Tree() {
  const publicCollections = usePublicCollectionsStore(
    (state) => state.collections,
  );

  const setTemplate = useEditorStore((state) => state.setTemplate);
  const setActiveFilePath = useFilesStore((state) => state.setActiveFile);
  const activeFilePath = useFilesStore((state) => state.activeFile);
  const collections = useFilesStore((state) => state.collections);
  const activeCollection = useFilesStore((state) => state.activeCollection);
  const data = collections.find((c) => c.id === activeCollection)?.files || [];
  const currentWorkingFolder = useFilesStore((state) => state.currenFolder);
  const setCurrentWorkingFolder = useFilesStore(
    (state) => state.setCurrentFolder,
  );
  const moveItem = useFilesStore((state) => state.moveItem);

  const localNode = getNodeContent(currentWorkingFolder, data);
  const localItems =
    localNode && isFolder(localNode)
      ? localNode.files
      : currentWorkingFolder.length === 0
        ? data
        : [];

  const publicCollection = publicCollections.find((collection) => {
    const activeLocalCollection = collections.find(
      (c) => c.id === activeCollection,
    );

    return collection.name === activeLocalCollection?.name;
  });

  let publicItems: NodeType[] = [];

  if (publicCollection) {
    const publicNode = getNodeContent(
      currentWorkingFolder,
      publicCollection.files,
    );
    const rawPublicItems =
      publicNode && isFolder(publicNode)
        ? publicNode.files
        : currentWorkingFolder.length === 0
          ? publicCollection.files
          : [];
    publicItems = markAsPublic(rawPublicItems);
  }

  const mergedMap = new Map<string, NodeType>();

  for (const item of publicItems) {
    mergedMap.set(item.name, item);
  }

  for (const item of localItems) {
    mergedMap.set(item.name, item);
  }

  const currentItems = Array.from(mergedMap.values());

  const folders = currentItems
    .filter(isFolder)
    .sort((a, b) => a.name.localeCompare(b.name));
  const files = currentItems
    .filter(isFile)
    .sort((a, b) => a.name.localeCompare(b.name));

  const manager = new DragDropManager({
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
  });

  useEffect(() => {
    usePublicCollectionsStore.getState().loadPublicCollections();
  }, [activeCollection]);

  return (
    <DragDropProvider
      manager={manager}
      onDragEnd={(event) => {
        if (event.canceled) return;

        const { source, target } = event.operation;

        if (!target) return;

        if (source?.id === target?.id) {
          return;
        }

        moveItem(source?.data.path, [...target.data.path, source?.data.name]);
      }}
    >
      <div className="flex min-h-0 flex-1 grow flex-col">
        <FolderHeader />
        <ScrollArea className="size-full overflow-auto">
          <div className="flex h-full w-full flex-col gap-2 p-2">
            {folders.map(({ name, isPublic }) => (
              <Node
                key={name}
                name={name}
                type="folder"
                isPublic={isPublic}
                path={currentWorkingFolder.concat(name)}
                onClick={() => {
                  setCurrentWorkingFolder(currentWorkingFolder.concat(name));
                }}
              />
            ))}
            {files.map(({ name, content, isPublic }) => (
              <Node
                key={name}
                name={name}
                type="file"
                isPublic={isPublic}
                path={currentWorkingFolder.concat(name)}
                isActive={
                  activeFilePath.join("/") ===
                  currentWorkingFolder.concat(name).join("/")
                }
                onClick={() => {
                  setTemplate(content);
                  setActiveFilePath(currentWorkingFolder.concat(name));
                }}
              />
            ))}
            {currentItems.length === 0 && (
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
