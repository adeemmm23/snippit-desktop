import { Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import Settings from "@/features/settings";
import { Button } from "@/ui/button";
import { Dialog, DialogTrigger } from "@/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";

export default function SaveButton() {
  return (
    <Dialog>
      <Tooltip>
        <DialogTrigger
          render={
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm">
                  <HugeiconsIcon icon={Settings01Icon} className="size-4" />
                </Button>
              }
            />
          }
        />
        <Settings />
        <TooltipContent side="bottom">
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>
    </Dialog>
  );
}
