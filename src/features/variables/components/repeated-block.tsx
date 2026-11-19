import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import VariableInput from "./variable-input";

import { useEditorStore } from "@/stores/editor/editor-store";
import { Button } from "@/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";

type RepeatedBlockProps = {
  name: string;
  keys: string[];
  count: number;
  /** Index of the first variable of this block in the whole panel */
  startIndex: number;
  totalVariables: number;
};

export default function RepeatedBlock({
  name,
  keys,
  count,
  startIndex,
  totalVariables,
}: RepeatedBlockProps) {
  const variables = useEditorStore((state) => state.variables);
  const addBlock = useEditorStore((state) => state.addBlock);
  const removeBlock = useEditorStore((state) => state.removeBlock);

  return (
    <>
      <div className="relative my-2">
        <div className="bg-muted h-0.5 w-full"></div>
        <div className="text-muted-foreground bg-muted absolute top-1/2 left-1/2 -translate-1/2 rounded-2xl px-2 text-xs">
          <p className="block h-6 max-w-48 truncate px-1 leading-6 select-none">
            {name}
          </p>
        </div>
      </div>

      {keys.map((key, index) => (
        <VariableInput
          key={key}
          index={startIndex + index}
          name={key}
          value={variables[key]}
          totalVariables={totalVariables}
        />
      ))}

      <div className="relative my-2">
        <div className="bg-muted h-0.5 w-full"></div>
        <div className="text-muted-foreground bg-muted absolute top-1/2 left-1/2 flex -translate-1/2 items-center gap-1 rounded-2xl px-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Repeat ${name}`}
                  onClick={() => addBlock(name)}
                >
                  <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent side="bottom">Repeat {name}</TooltipContent>
          </Tooltip>
          {count > 1 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove last ${name}`}
                    onClick={() => removeBlock(name)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="bottom">Remove last {name}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </>
  );
}
