import { DatabaseImportIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";

import FolderSelector from "./folder-selector";
import ImportFileDropzone from "./import-file-dropzone";

import { useFilesStore } from "@/stores/files/files-store";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { fromTree, generateId, getAncestry } from "@/utils/files.utils";

export default function ImportDialog() {
  const addNodes = useFilesStore((state) => state.addNodes);
  const collections = useFilesStore((state) => state.collections);
  const collectionsList = collections.map((collection) => ({
    value: collection.id,
    label: collection.name,
  }));
  const activeCollection = useFilesStore((state) => state.activeCollection);
  const [selectedCollection, setSelectedCollection] =
    useState(activeCollection);

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFolderId, setImportFolderId] = useState<string | null>(null);

  const canConfirmImport = importFile !== null;

  // The label is worked out from the id, so it stays right if the folder is renamed.
  const importFolderLabel =
    importFolderId === null
      ? "Root"
      : getAncestry(
          collections.find((c) => c.id === selectedCollection)?.nodes ?? {},
          importFolderId,
        )
          .map((node) => node.name)
          .join(" / ") || "Root";

  const handleImport = () => {
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        const { files } = importedData;

        if (!Array.isArray(files)) {
          toast.error("This isn't a valid Snippit export file");
          return;
        }

        // Never trust the file's shape: clean it while turning it into nodes.
        // addNodes then gives every node a new id of its own.
        const nodes = fromTree(files, generateId);

        addNodes(nodes, importFolderId, selectedCollection);
        setImportOpen(false);
        setImportFile(null);
      } catch {
        toast.error("Could not read this file");
      }
    };
    reader.readAsText(importFile);
  };

  return (
    <Dialog
      open={importOpen}
      onOpenChange={(open) => {
        setImportOpen(open);
        if (!open) {
          setImportFile(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline">
            <HugeiconsIcon icon={DatabaseImportIcon} />
            Import
          </Button>
        }
      />
      <DialogContent
        forceOverlayRender
        className="bg-popover select-none data-nested-dialog-open:scale-95"
      >
        <DialogHeader>
          <DialogTitle>Import snippets</DialogTitle>
          <DialogDescription>
            Select a file and choose where it should live.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="import-file">Select File</Label>
            <ImportFileDropzone
              file={importFile}
              onFileChange={setImportFile}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="import-folder">Collection</Label>
            <Select
              items={collectionsList}
              value={selectedCollection}
              onValueChange={(value) => {
                setSelectedCollection(value ?? activeCollection);
                // A folder id only exists inside its own collection.
                setImportFolderId(null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Collections</SelectLabel>
                  {collections.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="import-folder">Folder location</Label>
            <Dialog>
              <DialogTrigger
                render={
                  <Button className="justify-start" variant="outline">
                    {importFolderLabel}
                  </Button>
                }
              />
              <FolderSelector
                onSelect={setImportFolderId}
                selectedCollection={selectedCollection}
              />
            </Dialog>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setImportOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!canConfirmImport}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
