import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import SettingGroup from "../ui/setting-group";

import useSettingsStore from "@/stores/settings/settings-store";
import { Button } from "@/ui/button";
import { InputGroupInput, InputGroup, InputGroupAddon } from "@/ui/input-group";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";

export default function TimerSettingGroup() {
  const timerDuration = useSettingsStore((state) => state.timerDuration);
  const setTimerDuration = useSettingsStore((state) => state.setTimerDuration);
  const isTimerEnabled = useSettingsStore((state) => state.isTimerEnabled);
  const setTimerEnabled = useSettingsStore((state) => state.setTimerEnabled);

  return (
    <SettingGroup title="Reset Timer">
      <p className="text-muted-foreground text-sm">
        Set a timer that resets variables after certain duration in seconds.
      </p>
      <div className="flex flex-col gap-3">
        <div className="flex w-full gap-1">
          <InputGroup className="max-w-40">
            <InputGroupInput
              id="timerDuration"
              type="number"
              min={3}
              max={3600}
              placeholder="Variable name"
              value={timerDuration}
              onChange={(e) => setTimerDuration(Number(e.target.value))}
            />
            <InputGroupAddon align="inline-end" className="flex gap-0">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  if (timerDuration > 3) {
                    setTimerDuration(timerDuration - 1);
                  }
                }}
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  className="size-4 shrink-0"
                />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  if (timerDuration < 3600) {
                    setTimerDuration(timerDuration + 1);
                  }
                }}
              >
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="size-4 shrink-0"
                />
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="timerEnabled"
            checked={isTimerEnabled}
            onCheckedChange={setTimerEnabled}
          />
          <Label htmlFor="timerEnabled">Enable Timer</Label>
        </div>
      </div>
    </SettingGroup>
  );
}
