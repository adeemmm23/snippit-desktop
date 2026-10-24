import { save } from "@tauri-apps/plugin-dialog"; // Tauri v2 dialog plugin
import { writeTextFile } from "@tauri-apps/plugin-fs"; // Tauri v2 fs plugin
import { useMemo, useState } from "react";

import { useFilesStore } from "@/stores/files/files-store";
import useSettingsStore from "@/stores/settings/settings-store";
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
import { Input } from "@/ui/input";
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

export default function ExportDialog() {
  const collections = useFilesStore((state) => state.collections);
  const collectionsList = collections.map((collection) => ({
    value: collection.id,
    label: collection.name,
  }));

  const activeCollection = useFilesStore((state) => state.activeCollection);

  const [selectedCollection, setSelectedCollection] =
    useState(activeCollection);

  const files =
    collections.find((c) => c.id === selectedCollection)?.files || [];

  const variableFormat = useSettingsStore((state) => state.variableFormat);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportFileName, setExportFileName] = useState("snippets.json");

  const sanitizedExportFileName = useMemo(() => {
    const trimmed = exportFileName.trim();
    if (trimmed.length === 0) return "";
    return trimmed.endsWith(".json") ? trimmed : `${trimmed}.json`;
  }, [exportFileName]);

  const canConfirmExport = sanitizedExportFileName.length > 0;

  const handleExport = async () => {
    if (!canConfirmExport) return;

    try {
      // 1. Open Tauri's native OS save dialog
      const filePath = await save({
        defaultPath: sanitizedExportFileName,
        filters: [
          {
            name: "JSON Files",
            extensions: ["json"],
          },
        ],
      });

      // If the user cancels the dialog, filePath will be null
      if (!filePath) return;

      // 2. Prepare the payload string
      const data = {
        files,
        variableFormat,
      };
      const fileContent = JSON.stringify(data, null, 2); // Pretty-printed JSON is usually best for exports

      // 3. Write text content directly to the chosen path using the fs plugin
      await writeTextFile(filePath, fileContent);

      // 4. Close the dialog cleanly
      setExportOpen(false);
    } catch (error) {
      console.error("Failed to export file:", error);
    }
  };

  return (
    <Dialog open={exportOpen} onOpenChange={setExportOpen}>
      <DialogTrigger render={<Button variant="outline">Export</Button>} />
      <DialogContent forceOverlayRender className="bg-popover select-none">
        <DialogHeader>
          <DialogTitle>Export snippets</DialogTitle>
          <DialogDescription>
            Choose a file name for your export.
          </DialogDescription>
        </DialogHeader>
        <Select
          items={collectionsList}
          value={selectedCollection}
          onValueChange={(value) => {
            setSelectedCollection(value ?? activeCollection);
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="export-file-name">File name</Label>
          <Input
            id="export-file-name"
            value={exportFileName}
            onChange={(e) => setExportFileName(e.target.value)}
            placeholder="snippets.json"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setExportOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={!canConfirmExport}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
