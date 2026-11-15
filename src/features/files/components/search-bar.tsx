import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useState } from "react";

import { useCollectionNodes } from "@/hooks/use-collection-nodes";
import { useOpenFile } from "@/hooks/use-open-file";
import { NO_OPENED_FILES, useFilesStore } from "@/stores/files/files-store";
import { Button } from "@/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/ui/command";
import { Kbd, KbdGroup } from "@/ui/kbd";
import { indexFiles, type IndexedFile } from "@/utils/files.utils";

type SearchFile = IndexedFile & { isPublic: boolean };

export default function SearchBar() {
  // The history of the active collection only; each collection keeps its own.
  const openedFiles = useFilesStore(
    (state) => state.openedFiles[state.activeCollection] ?? NO_OPENED_FILES,
  );
  const { local, publicNodes } = useCollectionNodes();
  const openFile = useOpenFile();

  const [open, setOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");

  // Local files plus public ones, except public files a local file with the
  // same path replaces (the folder view hides those too).
  const indexedFiles = useMemo<SearchFile[]>(() => {
    const localFiles = indexFiles(local).map((f) => ({ ...f, isPublic: false }));
    if (!publicNodes) return localFiles;

    const localPaths = new Set(localFiles.map((f) => f.path));
    const publicOnly = indexFiles(publicNodes)
      .filter((f) => !localPaths.has(f.path))
      .map((f) => ({ ...f, isPublic: true }));

    return [...localFiles, ...publicOnly];
  }, [local, publicNodes]);

  const byId = useMemo(
    () => new Map(indexedFiles.map((f) => [f.id, f])),
    [indexedFiles],
  );

  const toItems = (list: typeof openedFiles) =>
    list
      .map((entry) => byId.get(entry.id))
      .filter((file): file is SearchFile => file !== undefined)
      .slice(0, 3)
      .map((file) => (
        <FileItem
          key={file.id}
          file={file}
          onSelect={() => {
            openFile(file.id);
            setOpen(false);
          }}
        />
      ));

  // Sort copies: the array in the store must never be mutated.
  const generateMostOpened = () =>
    toItems(
      [...openedFiles].sort(
        (a, b) => getScore(b.count, b.openedAt) - getScore(a.count, a.openedAt),
      ),
    );

  const generateLatest = () =>
    toItems([...openedFiles].sort((a, b) => b.openedAt - a.openedAt));

  const generatePreview = () =>
    indexedFiles.map((file) => (
      <FileItem
        key={file.id}
        file={file}
        onSelect={() => {
          openFile(file.id);
          setOpen(false);
        }}
      />
    ));

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="flex px-2">
      <Button
        variant="outline"
        className="w-full cursor-text"
        onClick={() => setOpen(true)}
      >
        <div className="flex gap-2">
          <HugeiconsIcon icon={Search01Icon} className="size-5" />
          <span className="text-muted-foreground text-sm">Find...</span>
        </div>
        <KbdGroup className="ml-auto">
          <Kbd>Ctrl</Kbd>
          <span>+</span>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        onOpenChangeComplete={() => setQuery("")}
      >
        <Command>
          <CommandInput
            placeholder="Find..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {query.length > 0 ? "No results found." : "Search for a file"}
            </CommandEmpty>
            {query.length == 0 && openedFiles.length > 0 && (
              <>
                <CommandGroup heading="Most opened">
                  {generateMostOpened()}
                </CommandGroup>
                <CommandGroup heading="Latest">{generateLatest()}</CommandGroup>
              </>
            )}
            {query.length > 0 && (
              <CommandGroup heading="Results">{generatePreview()}</CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}

type FileItemProps = {
  file: SearchFile;
  onSelect: () => void;
};

function FileItem({ file, onSelect }: FileItemProps) {
  return (
    // `value` carries the path so the command filter matches on it; ids are never shown.
    <CommandItem
      className="gap-5"
      value={`${file.name} ${file.path} ${file.id}`}
      onSelect={onSelect}
    >
      <span className="shrink-0 truncate">{file.name}</span>
      <span className="text-muted-foreground grow truncate text-right text-xs">
        {file.path}
      </span>
    </CommandItem>
  );
}

const getScore = (count: number, lastOpenedAt: number) => {
  const now = Date.now();
  const timeElapsed = (now - lastOpenedAt) / (1000 * 60 * 60 * 24);
  const LAMBDA = 0.1;
  return count * Math.exp(-LAMBDA * timeElapsed);
};
