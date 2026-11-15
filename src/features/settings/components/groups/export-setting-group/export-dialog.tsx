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
import { toTree } from "@/utils/files.utils";

export default function ExportDialog() {
  const collections = useFilesStore((state) => state.collections);
  const collectionsList = collections.map((collection) => ({
    value: collection.id,
    label: collection.name,
  }));

  const activeCollection = useFilesStore((state) => state.activeCollection);

  const [selectedCollection, setSelectedCollection] =
    useState(activeCollection);

  const nodes =
    collections.find((c) => c.id === selectedCollection)?.nodes ?? {};

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
      const filePath = await save({
        defaultPath: sanitizedExportFileName,
        filters: [
          {
            name: "JSON Files",
            extensions: ["json"],
          },
        ],
      });

      if (!filePath) return;

      const data = {
        // The export file keeps the nested format, so it stays readable and
        // works as a public collection file.
        files: toTree(nodes),
        variableFormat,
      };

      const fileContent = JSON.stringify(data, null, 2);

      await writeTextFile(filePath, fileContent);

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
