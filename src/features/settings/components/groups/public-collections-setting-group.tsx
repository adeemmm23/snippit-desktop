import {
  Delete02Icon,
  LibraryIcon,
  Link01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { cn } from "cn";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import SettingGroup from "../ui/setting-group";

import useSettingsStore from "@/stores/settings/settings-store";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { ScrollArea } from "@/ui/scroll-area";
import { Separator } from "@/ui/separator";
import { Switch } from "@/ui/switch";

type ValidatedCollection = {
  name: string;
  path: string;
};

export default function PublicCollectionsSettingGroup() {
  const publicFolders = useSettingsStore((state) => state.publicFolders);
  const addPublicFolder = useSettingsStore((state) => state.addPublicFolder);

  const [actionDialog, setActionDialog] = useState<boolean | null>(null);
  const [validatedCollections, setValidatedCollections] = useState<
    ValidatedCollection[]
  >([]);

  useEffect(() => {
    let isMounted = true;

    const validatePublicFolders = async () => {
      const allValidCollections: ValidatedCollection[] = [];

      for (const folderPath of publicFolders) {
        try {
          const filesList = await readDir(folderPath);

          const jsonFiles = filesList.filter(
            (file) => file.isFile && file.name.endsWith(".json"),
          );

          for (const file of jsonFiles) {
            try {
              const filePath = `${folderPath}\\${file.name}`;
              const content = await readTextFile(filePath);
              const parsed = JSON.parse(content);

              const isValidCollection =
                typeof parsed === "object" &&
                parsed !== null &&
                Array.isArray(parsed.files) &&
                typeof parsed.variableFormat === "string";

              if (isValidCollection) {
                allValidCollections.push({
                  name: file.name.replace(".json", ""),
                  path: filePath,
                });
              } else {
                console.warn(`Skipped invalid snippet file: ${file.name}`);
              }
            } catch (err) {
              console.error(`Failed to parse ${file.name}:`, err);
            }
          }
        } catch (folderErr) {
          console.error(`Failed to read folder ${folderPath}:`, folderErr);
        }
      }

      if (isMounted) {
        setValidatedCollections(allValidCollections);
      }
    };

    validatePublicFolders();

    return () => {
      isMounted = false;
    };
  }, [publicFolders]);

  return (
    <>
      <SettingGroup title="Public Collections">
        <p className="text-muted-foreground text-sm">
          Add pre-made collections of files to your database.
        </p>
        <div className="flex flex-col gap-2">
          {validatedCollections.map((collection) => (
            <PublicCollection
              key={collection.path}
              name={collection.name}
              path={collection.path}
            />
          ))}
        </div>
        <Button
          variant="default"
          onClick={() => setActionDialog(true)}
          className="mt-4 w-fit"
        >
          <HugeiconsIcon icon={Link01Icon} className="h-4 w-4" />
          <span>Link Public Folders</span>
        </Button>
      </SettingGroup>
      <Dialog
        open={actionDialog == true}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog(null);
          }
        }}
      >
        <DialogContent className="bg-popover" forceOverlayRender>
          <DialogHeader>
            <DialogTitle>Link Public Folders</DialogTitle>
            <DialogDescription>Please select a folder path.</DialogDescription>
          </DialogHeader>
          <div
            role="button"
            tabIndex={0}
            className={cn(
              "border-input hover:border-primary/60 bg-card flex h-full min-h-36 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 text-center transition select-none",
            )}
            onClick={async () => {
              const path = await open({
                directory: true,
                multiple: false,
                title: "Select a Public Folder",
              });

              if (!path || typeof path !== "string") return;

              addPublicFolder(path);
            }}
          >
            <HugeiconsIcon
              icon={LibraryIcon}
              className="text-muted-foreground size-6"
            />
            <div className="text-sm font-medium">
              {"Drop a public folder here"}
            </div>
            <div className="text-muted-foreground text-xs">
              {"Or, click to browse"}
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            {publicFolders.map((folderPath) => (
              <PublicFolderPath key={folderPath} path={folderPath} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type PublicFolderPathProps = {
  path: string;
};

function PublicFolderPath({ path }: PublicFolderPathProps) {
  const removePublicFolder = useSettingsStore(
    (state) => state.removePublicFolder,
  );
  return (
    <div className="flex w-full min-w-0 gap-2">
      <div className="border-border bg-background dark:bg-input/30 dark:border-input flex h-9 min-w-0 flex-1 items-center justify-between rounded-md border px-2.5 shadow-xs">
        <ScrollArea className="w-full min-w-0 whitespace-nowrap">
          <div className="flex h-full items-center text-sm">{path}</div>
        </ScrollArea>
      </div>
      <Button
        variant="destructive"
        size="icon"
        className="shrink-0"
        onClick={() => removePublicFolder(path)}
      >
        <HugeiconsIcon icon={Delete02Icon} />
      </Button>
    </div>
  );
}

type PublicCollectionProps = {
  name: string;
  path: string;
};

function PublicCollection({ name, path }: PublicCollectionProps) {
  const publicCollections = useSettingsStore(
    (state) => state.publicCollections,
  );
  const addPublicCollection = useSettingsStore(
    (state) => state.addPublicCollection,
  );
  const removePublicCollection = useSettingsStore(
    (state) => state.removePublicCollection,
  );

  const isAdded = publicCollections.includes(path);
  return (
    <div
      title={path}
      className="border-border bg-background dark:bg-input/30 dark:border-input flex h-9 max-w-72 min-w-0 items-center justify-between rounded-md border px-2.5 shadow-xs"
    >
      <ScrollArea className="w-full min-w-0 whitespace-nowrap">
        <div className="flex h-full items-center text-sm">{name}</div>
      </ScrollArea>
      <Separator
        orientation="vertical"
        className="bg-border mx-2 my-auto h-4"
      />
      <Switch
        defaultChecked={isAdded}
        checked={isAdded}
        onCheckedChange={(value) => {
          if (value) {
            const isThereDuplicateRemoved = addPublicCollection(path);
            if (isThereDuplicateRemoved) {
              toast.info("Collection replaced with new path.");
            }
          } else {
            removePublicCollection(path);
          }
        }}
      />
    </div>
  );
}
