import {
  LayoutAlignLeftIcon,
  LayoutAlignRightIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { usePanelRef } from "react-resizable-panels";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type PanelToggleProps = {
  panelRef: ReturnType<typeof usePanelRef>;
  side: "left" | "right";
};

export default function PanelToggle({ panelRef, side }: PanelToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              const isCollapsed = panelRef.current?.isCollapsed();

              if (isCollapsed) {
                panelRef.current?.expand();
              } else {
                panelRef.current?.collapse();
              }
            }}
          >
            <HugeiconsIcon
              icon={
                side === "left" ? LayoutAlignLeftIcon : LayoutAlignRightIcon
              }
              className="size-4"
            />
          </Button>
        }
      />
      <TooltipContent side="bottom">
        <p>Toggle left panel</p>
      </TooltipContent>
    </Tooltip>
  );
}
