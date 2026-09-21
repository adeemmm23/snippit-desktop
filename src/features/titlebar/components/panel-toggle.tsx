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
  otherPanelRef: ReturnType<typeof usePanelRef>;
  side: "left" | "right";
};

export default function PanelToggle({
  panelRef,
  otherPanelRef,
  side,
}: PanelToggleProps) {
  const togglePanel = () => {
    if (panelRef.current?.isCollapsed()) {
      panelRef.current?.expand();
      if (panelRef.current?.isCollapsed()) {
        otherPanelRef.current?.collapse();
        panelRef.current?.expand();
      }
    } else {
      panelRef.current?.collapse();
    }
  };
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" onClick={() => togglePanel()}>
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
        <p>Toggle {side} panel</p>
      </TooltipContent>
    </Tooltip>
  );
}
