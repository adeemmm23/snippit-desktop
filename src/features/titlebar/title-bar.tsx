import type { usePanelRef } from "react-resizable-panels";

import FilePath from "./components/file-path";
import PanelToggle from "./components/panel-toggle";
import SaveButton from "./components/save-button";
import SettingsButton from "./components/settings-button";
import TemporaryFileButton from "./components/temporary-file-button";
import WindowControls from "./components/window-control";

import { Separator } from "@/components/ui/separator";

type TitleBarProps = {
  leftPanelRef: ReturnType<typeof usePanelRef>;
  rightPanelRef: ReturnType<typeof usePanelRef>;
};
export default function TitleBar({
  leftPanelRef,
  rightPanelRef,
}: TitleBarProps) {
  return (
    <div
      data-tauri-drag-region
      className="flex w-full items-center justify-between select-none"
    >
      <div className="flex w-20 items-center gap-1 py-1 pl-1">
        <PanelToggle
          side="left"
          panelRef={leftPanelRef}
          otherPanelRef={rightPanelRef}
        />
        <Separator orientation="vertical" className="my-auto h-3" />
        <TemporaryFileButton />
        <SaveButton />
      </div>
      <FilePath />
      <div className="flex h-full w-20 items-center justify-end gap-1">
        <div className="flex items-center gap-1 py-1">
          <SettingsButton />
          <Separator orientation="vertical" className="my-auto h-3" />
          <PanelToggle
            side="right"
            panelRef={rightPanelRef}
            otherPanelRef={leftPanelRef}
          />
        </div>
        <WindowControls />
      </div>
    </div>
  );
}
