import { Warning } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { save } from "@tauri-apps/plugin-dialog"; // Tauri v2 dialog plugin
import { writeTextFile } from "@tauri-apps/plugin-fs"; // Tauri v2 fs plugin
import { useMemo, useState } from "react";

import { useFilesStore } from "@/stores/files/files-store";
import useSettingsStore from "@/stores/settings/settings-store";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/ui/alert";
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
import { Switch } from "@/ui/switch";
import { addPublicPrefix } from "@/utils/files.utils";

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
    collections.find((c) => c.id === selectedCollection)?.files || [];

  const variableFormat = useSettingsStore((state) => state.variableFormat);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportFileName, setExportFileName] = useState("snippets.json");
  const [isPublic, setIsPublic] = useState(false);

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

      const files = isPublic ? addPublicPrefix(nodes) : nodes;

      const data = {
        files,
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
        <Alert>
          <HugeiconsIcon icon={Warning} />
          <AlertTitle>Public IDs</AlertTitle>
          <AlertDescription>
            Adds a{" "}
            <code className="bg-muted text-muted-foreground rounded-sm px-1 py-0.5 font-mono text-xs">
              pub
            </code>{" "}
            prefix to the ID of every file and folder in the export.
          </AlertDescription>
          <AlertAction>
            <Switch
              id="exportPublicIds"
              aria-label="Add pub- prefix to exported IDs"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(!!checked)}
            />
          </AlertAction>
        </Alert>
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
