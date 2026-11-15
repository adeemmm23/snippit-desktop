import {
  FileAddIcon,
  FolderAddIcon,
  MoreVerticalIcon,
  PackageAdd01Icon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

import { IT_SUPPORT_SNIPPETS } from "@/constants/test.constants";
import { useFolderView } from "@/hooks/use-collection-nodes";
import { useFilesStore } from "@/stores/files/files-store";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { fromTree, generateId } from "@/utils/files.utils";

export default function Menu() {
  const createItem = useFilesStore((state) => state.createItem);
  const createCollection = useFilesStore((state) => state.createCollection);
  const ensureFolderPath = useFilesStore((state) => state.ensureFolderPath);
  const view = useFolderView();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"file" | "folder">("file");
  const [createName, setCreateName] = useState("");

  const defaultName = createType === "file" ? "New File" : "New Folder";

  useEffect(() => {
    if (createDialogOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCreateName(defaultName);
    }
  }, [createDialogOpen, createType]);

  const handleOpenCreateDialog = (type: "file" | "folder") => {
    setCreateType(type);
    setCreateDialogOpen(true);
  };

  const handleCreateItem = () => {
    if (createName.trim().length === 0) return;

    // The folder on screen may exist only in the public collection;
    // in that case its local twin is created first.
    const parentId = view.local
      ? view.local.id
      : ensureFolderPath(view.namePath);

    createItem(parentId, createType, createName.trim());
    setCreateDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon">
              <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <HugeiconsIcon icon={Refresh01Icon} className="size-4" />
              Refresh
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => handleOpenCreateDialog("file")}>
              <HugeiconsIcon icon={FileAddIcon} className="size-4" />
              New File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenCreateDialog("folder")}>
              <HugeiconsIcon icon={FolderAddIcon} className="size-4" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                createCollection(
                  "IT Support Snippets",
                  fromTree(IT_SUPPORT_SNIPPETS, generateId),
                );
              }}
            >
              <HugeiconsIcon icon={PackageAdd01Icon} className="size-4" />
              Dummy
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent forceOverlayRender className="bg-popover">
          <DialogHeader>
            <DialogTitle>
              {createType === "folder" ? "Create folder" : "Create file"}
            </DialogTitle>
            <DialogDescription>
              Enter a name for the new {createType}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="create-item-name">Name</Label>
            <Input
              id="create-item-name"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreateItem();
                }
              }}
              placeholder={
                createType === "folder" ? "Folder name" : "File name"
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateItem}
              disabled={createName.trim().length === 0}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
