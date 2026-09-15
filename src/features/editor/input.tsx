import {
  ClipboardPasteIcon,
  Copy01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { writeText, readText } from "@tauri-apps/plugin-clipboard-manager";
import { useEffect, useRef } from "react";

import useGetSelectionDetails, {
  insertTextAtCursor,
} from "../../hooks/use-get-selection-details";

import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editor/editor-store";

export function Input() {
  const template = useEditorStore((state) => state.template);
  const setTemplate = useEditorStore((state) => state.setTemplate);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleClear = () => {
    setTemplate("");
  };
  // Sync the contentEditable div with the template state
  useEffect(() => {
    if (editorRef.current) {
      const currentText = editorRef.current.innerText || "";
      if (currentText !== template) {
        editorRef.current.innerText = template;
      }
    }
  }, [template]);

  const selectionDetails = useGetSelectionDetails();

  const handleCopy = async () => {
    if (!selectionDetails?.text) return;

    try {
      await writeText(selectionDetails.text);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await readText();
      insertTextAtCursor(text, editorRef.current);
    } catch (err) {
      console.error("Failed to paste text:", err);
    }
  };

  // TODO: fix HTML
  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div className="relative flex h-full min-h-0 flex-col">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleClear()}
                    className="absolute top-2 right-2 z-10"
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                  </Button>
                }
              />
              <TooltipContent side="left">
                <p>Clear text zone</p>
              </TooltipContent>
            </Tooltip>
            {/*{template.trim().length === 0 && (
        <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 font-mono text-base opacity-50 select-none">
          Template
        </span>
      )}*/}
            <div className="border-input bg-input/10 dark:bg-input/30 focus-within:border-primary flex min-h-0 flex-1 overflow-hidden rounded-md border shadow-xs transition-colors focus:outline-none">
              <ScrollArea className="h-full w-full">
                <div
                  ref={editorRef}
                  contentEditable="plaintext-only"
                  onInput={(e) => {
                    const text = e.currentTarget.innerText || "";
                    setTemplate(text);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData("text/plain");
                    document.execCommand("insertText", false, text);
                  }}
                  className="min-h-full p-3 font-mono text-base outline-none"
                  suppressContentEditableWarning
                />
              </ScrollArea>
            </div>
          </div>
        }
      />
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel className="select-none">Editor</ContextMenuLabel>
          <ContextMenuItem onClick={handleCopy}>
            <HugeiconsIcon icon={Copy01Icon} />
            Copy
          </ContextMenuItem>
          <ContextMenuItem onClick={handlePaste}>
            <HugeiconsIcon icon={ClipboardPasteIcon} />
            Paste
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
