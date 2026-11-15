import { FloppyDiskIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect } from "react";
import { toast } from "sonner";

import SaveIndicator from "./save-indicator";

import { useFilesStore } from "@/stores/files/files-store";
import { Button } from "@/ui/button";
import { KbdGroup, Kbd } from "@/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";

export default function SaveButton() {
  const saveActiveFile = useFilesStore((state) => state.saveActiveFile);

  const handleSave = () => {
    const result = saveActiveFile();

    if (result === "saved") {
      toast.success("File saved successfully!");
    } else if (result === "read-only") {
      toast.error("Public files are read-only. Download first!");
    } else {
      toast.error("No file is open to be saved!");
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            onClick={handleSave}
          >
            <HugeiconsIcon icon={FloppyDiskIcon} className="size-4" />
            <SaveIndicator />
          </Button>
        }
      />
      <TooltipContent side="bottom">
        <p>Save</p>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <span>+</span>
          <Kbd>S</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  );
}
