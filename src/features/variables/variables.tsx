import { ThreeDViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import RepeatedBlock from "./components/repeated-block";
import VariableInput from "./components/variable-input";
import VariablesHeader from "./components/variables-header";

import { TUTORIAL } from "@/constants/test.constants";
import { useEditorStore } from "@/stores/editor/editor-store";
import { Button } from "@/ui/button";
import { ScrollArea } from "@/ui/scroll-area";

export default function Variables() {
  const variables = useEditorStore((state) => state.variables);
  const layout = useEditorStore((state) => state.layout);
  const setTemplate = useEditorStore((state) => state.setTemplate);

  const isVariables = Object.keys(variables).length <= 0;

  // Every entry knows where its variables start, so the keyboard navigation
  // (ids "var0", "var1"...) follows the order shown on screen
  const sizes = layout.map((entry) =>
    entry.type === "block" ? entry.keys.length : 1,
  );
  const totalVariables = sizes.reduce((sum, size) => sum + size, 0);
  const startIndexes = sizes.map((_, i) =>
    sizes.slice(0, i).reduce((sum, size) => sum + size, 0),
  );

  // TODO: fix layout here
  return (
    <div
      className="border-border flex h-full min-w-48 grow flex-col gap-2 rounded-md rounded-r-none border border-r-0 py-2"
      data-tauri-drag-region
    >
      {!isVariables ? (
        <>
          <VariablesHeader />
          <ScrollArea className="grow overflow-auto">
            <div className="flex h-full flex-col gap-4 px-2 py-1">
              {layout.map((entry, index) =>
                entry.type === "block" ? (
                  <RepeatedBlock
                    key={`block:${entry.name}`}
                    name={entry.name}
                    keys={entry.keys}
                    count={entry.count}
                    startIndex={startIndexes[index]}
                    totalVariables={totalVariables}
                  />
                ) : (
                  <VariableInput
                    key={entry.name}
                    index={startIndexes[index]}
                    name={entry.name}
                    value={variables[entry.name]}
                    totalVariables={totalVariables}
                  />
                ),
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="text-muted-foreground my-auto py-8 text-center select-none">
          <div className="bg-muted mb-4 inline-flex items-center justify-center rounded-sm p-2">
            <HugeiconsIcon icon={ThreeDViewIcon} className="size-5" />
          </div>
          <p className="text-sm">No variables detected</p>
          <p className="mt-2 text-xs">{"Add {Something} to your template"}</p>
          <Button
            variant="ghost"
            size="xs"
            className="mt-4"
            onClick={() => setTemplate(TUTORIAL)}
          >
            Quick Start
          </Button>
        </div>
      )}
    </div>
  );
}
