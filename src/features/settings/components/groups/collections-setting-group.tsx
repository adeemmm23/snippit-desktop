import {
  Add01Icon,
  Delete02Icon,
  InputCursorTextIcon,
  Warning,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import SettingGroup from "../ui/setting-group";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useFilesStore } from "@/stores/files/files-store";
import { Alert, AlertDescription, AlertTitle } from "@/ui/alert";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { Input } from "@/ui/input";

type ActionDialogType = "delete" | "rename" | "create" | null;

export default function CollectionsSettingGroup() {
  const collections = useFilesStore((state) => state.collections);
  const createCollection = useFilesStore((state) => state.createCollection);
  const deleteCollection = useFilesStore((state) => state.deleteCollection);
  const renameCollection = useFilesStore((state) => state.renameCollection);

  const [actionDialog, setActionDialog] = useState<ActionDialogType>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);
  const [newName, setNewName] = useState("");

  // Find the active collection object based on ID
  const selectedCollection = collections.find(
    (c) => c.id === selectedCollectionId,
  );

  const handleDelete = () => {
    if (selectedCollectionId) {
      deleteCollection(selectedCollectionId);
      setActionDialog(null);
      setSelectedCollectionId(null);
    }
  };

  const handleRename = () => {
    if (selectedCollectionId && newName.trim()) {
      renameCollection(selectedCollectionId, newName.trim());
      setActionDialog(null);
      setSelectedCollectionId(null);
      setNewName("");
    }
  };

  const handleCreate = () => {
    if (newName.trim()) {
      createCollection(newName.trim());
      setActionDialog(null);
      setNewName("");
    }
  };

  const openDeleteDialog = (id: string) => {
    setSelectedCollectionId(id);
    setActionDialog("delete");
  };

  const openRenameDialog = (id: string, name: string) => {
    setSelectedCollectionId(id);
    setNewName(name);
    setActionDialog("rename");
  };

  const openCreateDialog = () => {
    setActionDialog("create");
    setNewName("");
  };

  return (
    <>
      <SettingGroup title="Collections">
        <p className="text-muted-foreground text-sm">
          Manage your collections. Delete or rename them as needed.
        </p>
        {collections.length === 0 ? (
          <p className="text-muted-foreground text-sm italic">
            No collections yet. Click "New" to create one.
          </p>
        ) : (
          <div className="space-y-2">
            {collections.map((collection) => (
              <div key={collection.id} className="flex gap-2">
                <div className="border-border bg-background dark:bg-input/30 dark:border-input flex h-9 max-w-60 grow items-center justify-between rounded-md border px-2.5 shadow-xs">
                  <span className="text-sm">{collection.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    openRenameDialog(collection.id, collection.name)
                  }
                >
                  <HugeiconsIcon icon={InputCursorTextIcon} />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => openDeleteDialog(collection.id)}
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="default"
          onClick={openCreateDialog}
          className="mt-4 w-fit"
        >
          <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
          <span>New</span>
        </Button>
      </SettingGroup>

      {/* Create Dialog */}
      <Dialog
        open={actionDialog === "create"}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog(null);
            setNewName("");
          }
        }}
      >
        <DialogContent className="bg-popover" forceOverlayRender>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Enter a name for your new collection.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Collection name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreate();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog(null);
                setNewName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={actionDialog === "rename"}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog(null);
            setSelectedCollectionId(null);
            setNewName("");
          }
        }}
      >
        <DialogContent className="bg-popover" forceOverlayRender>
          <DialogHeader>
            <DialogTitle>Rename Collection</DialogTitle>
            <DialogDescription>
              Enter a new name for "{selectedCollection?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Collection name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog(null);
                setSelectedCollectionId(null);
                setNewName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={actionDialog === "delete"}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog(null);
            setSelectedCollectionId(null);
          }
        }}
        title="Delete Collection"
        description={`Deleting "${selectedCollection?.name}" will remove all files in this collection.`}
        additionalContent={
          collections.length <= 1 ? (
            <Alert>
              <HugeiconsIcon icon={Warning} />
              <AlertTitle>Cannot delete collection</AlertTitle>
              <AlertDescription>
                You must have at least one collection. Please create a new
                collection before deleting this one.
              </AlertDescription>
            </Alert>
          ) : undefined
        }
        destructive
        disabled={collections.length <= 1}
        onConfirm={handleDelete}
      />
    </>
  );
}
