import {
  Loading03Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

import { useEditorStore } from "@/stores/editor/editor-store";
import useSettingsStore from "@/stores/settings/settings-store";
import { Button } from "@/ui/button";
import { KbdGroup, Kbd } from "@/ui/kbd";
import { Label } from "@/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";
import { cn } from "@/utils/cn";

export default function VariablesHeader() {
  const resetVariables = useEditorStore((state) => state.resetVariables);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "l" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        resetVariables();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="flex items-center justify-between p-2">
      <Label className="px-2 text-lg font-medium">Variables</Label>
      <div className="flex items-center gap-2">
        <ResetVariablesButton />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" onClick={() => {}}>
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  className="h-4 w-4"
                />
              </Button>
            }
          />
          <TooltipContent side="left">
            Select first variable
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <span>+</span>
              <Kbd>Enter</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function ResetVariablesButton() {
  const resetVariables = useEditorStore((state) => state.resetVariables);
  const variables = useEditorStore((state) => state.variables);
  const timerDuration = useSettingsStore((state) => state.timerDuration);
  const isTimerEnabled = useSettingsStore((state) => state.isTimerEnabled);

  const [progress, setProgress] = useState(0);

  const duration = timerDuration * 1000;

  const hasValues = Object.keys(variables).some((key) => variables[key] !== "");

  const isActive = isTimerEnabled && hasValues;

  useEffect(() => {
    if (!isActive) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(0);

    const start = performance.now();
    let animationFrame: number;

    const animate = (timestamp: number) => {
      const nextProgress = Math.min((timestamp - start) / duration, 1);

      setProgress(nextProgress);

      if (nextProgress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    const timeout = window.setTimeout(() => {
      resetVariables();
    }, duration);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(timeout);
    };
  }, [variables, resetVariables, isTimerEnabled, timerDuration]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={resetVariables}>
              <HugeiconsIcon
                icon={Loading03Icon}
                className={cn("size-4", isActive && "animate-spin-slow")}
              />
            </Button>
            <svg
              className={cn(
                "text-muted/0 pointer-events-none absolute inset-0 transition-colors",
              )}
              width="calc(var(--spacing) * 9 - 1px)"
              height="calc(var(--spacing) * 9 - 1px)"
              viewBox="0 0 40 40"
              fill="none"
            >
              <rect
                className={cn(
                  "text-foreground/0 transition-colors",
                  isActive && "text-foreground/30",
                )}
                x="1"
                y="1"
                width="38"
                height="38"
                rx="var(--radius-md)"
                pathLength="100"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="100"
                strokeDashoffset={100 - progress * 100}
              />
              <rect
                className={cn(
                  "text-foreground/0 transition-colors",
                  isActive && "text-foreground/5",
                )}
                x="1"
                y="1"
                width="38"
                height="38"
                rx="var(--radius-md)"
                pathLength="100"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="100"
                strokeDashoffset="0"
              />
            </svg>
          </div>
        }
      />

      <TooltipContent side="left">
        Reset variables
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <span>+</span>
          <Kbd>L</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  );
}
