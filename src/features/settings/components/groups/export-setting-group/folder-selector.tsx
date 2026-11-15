import { ArrowLeft, Folder01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState } from "react";

import FilePath from "./file-path";
import ImportDialogFooter from "./import-dialog-footer";

import { useFilesStore } from "@/stores/files/files-store";
import { isFolder } from "@/types/node.types";
import { Button } from "@/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { ScrollArea } from "@/ui/scroll-area";
import { Separator } from "@/ui/separator";
import { buildChildrenIndex, getAncestry } from "@/utils/files.utils";

type FolderSelectorProps = {
  /** Called with the chosen folder's id, `null` for the collection root. */
  onSelect: (folderId: string | null) => void;
  selectedCollection: string;
};

export default function FolderSelector({
  onSelect,
  selectedCollection,
}: FolderSelectorProps) {
  const collections = useFilesStore((state) => state.collections);
  const nodes = useMemo(
    () => collections.find((c) => c.id === selectedCollection)?.nodes ?? {},
    [collections, selectedCollection],
  );
  const children = useMemo(() => buildChildrenIndex(nodes), [nodes]);

  // The folder being browsed, and the one that is highlighted.
  const [browsingId, setBrowsingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // The folders from the root down to the one being browsed.
  const crumbs = getAncestry(nodes, browsingId ?? "")
    .filter(isFolder)
    .map(({ id, name }) => ({ id, name }));
  const currentItems = children.get(crumbs.at(-1)?.id ?? null) ?? [];

  const currentFolders = currentItems
    .filter(isFolder)
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleNavigate = (folderId: string | null) => {
    setBrowsingId(folderId);
    setSelectedId(folderId);
  };

  return (
    <DialogContent
      forceOverlayRender
      className="bg-popover flex h-7/12 flex-col gap-2"
    >
      <DialogHeader className="select-none">
        <DialogTitle>Choose a folder</DialogTitle>
        <DialogDescription>
          Select a folder to import your snippets into.
        </DialogDescription>
      </DialogHeader>
      <div className="mt-2 flex items-center gap-2">
        <Button
          size="icon-sm"
          variant="ghost"
          disabled={browsingId === null}
          onClick={() => handleNavigate(crumbs.at(-2)?.id ?? null)}
        >
          <HugeiconsIcon icon={ArrowLeft} className="size-4 shrink-0" />
        </Button>
        <Separator orientation="vertical" className="my-auto h-4" />
        <FilePath crumbs={crumbs} onNavigate={handleNavigate} />
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1 grow">
        <div className="flex h-full flex-col gap-1">
          {currentFolders.length === 0 ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center text-sm">
              <HugeiconsIcon icon={Folder01Icon} className="size-6 shrink-0" />
              <p className="px-2 py-3 text-sm select-none">
                No folders in this location
              </p>
            </div>
          ) : (
            currentFolders.map((folder) => {
              const isSelected = selectedId === folder.id;

              return (
                <Button
                  key={folder.id}
                  variant={isSelected ? "secondary" : "ghost"}
                  className="justify-start gap-2"
                  onClick={() => setSelectedId(folder.id)}
                  onDoubleClick={() => handleNavigate(folder.id)}
                >
                  <HugeiconsIcon
                    icon={Folder01Icon}
                    className="size-4 shrink-0"
                  />
                  {folder.name}
                </Button>
              );
            })
          )}
        </div>
      </ScrollArea>
      <ImportDialogFooter
        folderId={browsingId}
        onSelect={() => {
          onSelect(selectedId);
        }}
        selectedCollection={selectedCollection}
      />
    </DialogContent>
  );
}
