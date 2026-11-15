import { useDroppable } from "@dnd-kit/react";
import { ArrowLeft01Icon, Home02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import Menu from "./menu";

import { useFolderView } from "@/hooks/use-collection-nodes";
import { useFilesStore } from "@/stores/files/files-store";
import { Button } from "@/ui/button";
import { cn } from "@/utils/cn";
import { isPublicId } from "@/utils/files.utils";

export default function FolderHeader() {
  const view = useFolderView();
  const setCurrentFolder = useFilesStore((state) => state.setCurrentFolder);

  const current = view.ancestors.at(-1);

  // Dropping an item on the back row moves it one folder up.
  const { isDropTarget, ref: dropRef } = useDroppable({
    id: "folder-up",
    disabled: isPublicId(view.parentId),
    data: { folderId: view.parentId },
  });

  return (
    <div className="flex px-2">
      <div className="flex w-full gap-1">
        {current ? (
          <div
            ref={dropRef}
            role="button"
            tabIndex={0}
            title={current.name}
            className={cn(
              "group/button hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full min-w-0 flex-1 grow items-center justify-start gap-2 rounded-md border border-transparent pl-2.5 text-sm font-medium transition-all outline-none select-none focus-visible:ring-[3px]",
              isDropTarget && "bg-primary/20 border-primary/50",
            )}
            onClick={() => {
              setCurrentFolder(view.parentId);
            }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            <span className="overflow-hidden text-nowrap text-ellipsis">
              {current.name}
            </span>
          </div>
        ) : (
          <Button variant="ghost" className="grow justify-start gap-2">
            <HugeiconsIcon icon={Home02Icon} className="size-4" />
            <span>Root</span>
          </Button>
        )}
        <Menu />
      </div>
    </div>
  );
}
