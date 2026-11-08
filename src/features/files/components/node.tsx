import { useDraggable, useDroppable } from "@dnd-kit/react";
import {
  Delete02Icon,
  Download01Icon,
  File01Icon,
  FileCloudIcon,
  Folder01Icon,
  FolderCloudIcon,
  InputCursorTextIcon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useFilesStore } from "@/stores/files/files-store";
import { isFile, type NodeType } from "@/types/node.types";
import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { cn } from "@/utils/cn";

type NodeProps = {
  // name: string;
  // type: "file" | "folder";
  node: NodeType;
  path: string[];
  isActive?: boolean;
  // isPublic?: boolean;
  // content?: string;
  onClick: () => void;
};

export default function Node({ node, onClick, isActive, path }: NodeProps) {
  const removeItem = useFilesStore((state) => state.removeItem);
  const renameItem = useFilesStore((state) => state.renameItem);
  const createItem = useFilesStore((state) => state.createItem);

  const [isRenaming, setIsRenaming] = useState(false);
  // const [isSelected, setIsSelected] = useState(false);
  const [isOpened, setIsOpened] = useState(false);

  const { isDragging, ref: nodeRef } = useDraggable({
    id: path.join("/"),
    data: {
      path,
      name,
    },
  });

  const { isDropTarget, ref: dropRef } = useDroppable({
    id: path.join("/"),
    data: {
      path,
    },
  });

  const handleRenameStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
  };

  const handleRenameEnd = (newName: string) => {
    renameItem(path, newName);
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
  };

  const isDraggingOver = node.type == "folder" && isDropTarget && !isDragging;

  // TODO: check styling
  return (
    <>
      <Button
        variant="ghost"
        nativeButton={false}
        className={cn(
          "group w-full justify-start pr-0",
          isActive && "bg-foreground/5 hover:bg-foreground/10",
          isDraggingOver && "bg-primary/20 border-primary/50",
          isDragging && "opacity-50",
        )}
        render={
          <div
            ref={(n) => {
              nodeRef(n);
              if (node.type == "folder") dropRef(n);
            }}
            role="button"
            tabIndex={0}
            title={node.name}
            data-path={path.join("/")}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!isRenaming) {
                onClick();
              }
            }}
          >
            <HugeiconsIcon
              icon={
                node.type == "file"
                  ? node.isPublic
                    ? FileCloudIcon
                    : File01Icon
                  : node.isPublic
                    ? FolderCloudIcon
                    : Folder01Icon
              }
              className="size-4 shrink-0"
            />
            <Name
              name={node.name}
              isRenaming={isRenaming}
              onRenameEnd={handleRenameEnd}
              onRenameCancel={handleRenameCancel}
            />
            <div className="ml-auto flex size-9 shrink-0 items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.stopPropagation()}
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="pointer-events-none shrink-0 opacity-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 data-popup-open:pointer-events-auto data-popup-open:opacity-100"
                    >
                      <HugeiconsIcon
                        icon={MoreVerticalIcon}
                        className="size-4"
                      />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  {node.isPublic ? (
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() => {
                          createItem(
                            path,
                            node.type,
                            undefined,
                            isFile(node) ? node.content : undefined,
                          );
                        }}
                      >
                        <HugeiconsIcon
                          icon={Download01Icon}
                          className="size-4"
                        />
                        Download
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  ) : (
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={handleRenameStart}>
                        <HugeiconsIcon
                          icon={InputCursorTextIcon}
                          className="size-4"
                        />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpened(true);
                        }}
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        }
      ></Button>
      <ConfirmDialog
        open={isOpened}
        onOpenChange={setIsOpened}
        title={`Remove ${node.type}`}
        description={`Are you sure you want to remove ${node.name}?`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          removeItem(path);
          setIsOpened(false);
        }}
      />
    </>
  );
}

function Name({
  name,
  isRenaming,
  onRenameEnd,
  onRenameCancel,
}: {
  name: string;
  isRenaming: boolean;
  onRenameEnd: (newName: string) => void;
  onRenameCancel: () => void;
}) {
  const [newName, setNewName] = useState(name);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isRenaming && spanRef.current) {
      setNewName(name);
      spanRef.current.textContent = name;
      spanRef.current.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(spanRef.current);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [isRenaming, name]);

  const commitRename = () => {
    const nextName = newName.trim();
    if (nextName && nextName !== name) {
      onRenameEnd(nextName);
    } else {
      onRenameCancel();
    }
  };

  const cancelRename = () => {
    setNewName(name);
    if (spanRef.current) {
      spanRef.current.textContent = name;
    }
    onRenameCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRename();
    }
  };

  const handleInput = (e: React.InputEvent<HTMLSpanElement>) => {
    const text = e.currentTarget.textContent || "";
    setNewName(text);
  };

  if (isRenaming)
    return (
      <span
        ref={spanRef}
        contentEditable="plaintext-only"
        autoCorrect="off"
        suppressContentEditableWarning
        className="bg-primary/10 focus:bg-primary/20 box-border block min-w-0 flex-1 grow cursor-text overflow-hidden rounded-xs px-0.5 text-start text-ellipsis whitespace-nowrap outline-none"
        onBlur={cancelRename}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
      >
        {name}
      </span>
    );
  return (
    <span className="box-border min-w-0 grow overflow-hidden px-0.5 text-start text-ellipsis whitespace-nowrap">
      {name}
    </span>
  );
}
