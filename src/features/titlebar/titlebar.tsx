import {
  Subtract16Regular,
  Maximize16Regular,
  Dismiss16Regular,
  SquareMultiple16Regular,
} from "@fluentui/react-icons";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState, useEffect } from "react";

import FilePath from "./components/file-path";
import SaveButton from "./components/save-button";
import SettingsButton from "./components/settings-button";
import TemporaryFileButton from "./components/temporary-file-button";

import { Separator } from "@/components/ui/separator";

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    appWindow.isMaximized().then(setIsMaximized);

    const unlisten = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [appWindow]);

  const handleMinimize = () => appWindow.minimize();

  const handleToggleMaximize = async () => {
    await appWindow.toggleMaximize();
    const maximized = await appWindow.isMaximized();
    setIsMaximized(maximized);
  };

  const handleClose = () => appWindow.close();

  return (
    <div
      data-tauri-drag-region
      className="flex w-full items-center justify-between select-none"
    >
      <div className="flex w-48 items-center gap-2 py-1 pl-1">
        <TemporaryFileButton />
        <Separator orientation="vertical" className="my-auto h-3" />
        <SaveButton />
      </div>
      <FilePath />
      <div className="flex h-full w-48 items-center justify-end gap-2">
        <div className="flex py-1">
          <SettingsButton />
        </div>
        <div className="flex h-full items-center">
          {/* Minimize */}
          <button
            onClick={handleMinimize}
            className="text-foreground hover:bg-foreground/10 flex h-full w-11 items-center justify-center transition-colors"
          >
            <Subtract16Regular />
          </button>

          {/* Maximize / Restore Toggle */}
          <button
            onClick={handleToggleMaximize}
            className="text-foreground hover:bg-foreground/10 flex h-full w-11 items-center justify-center transition-colors"
          >
            {isMaximized ? <SquareMultiple16Regular /> : <Maximize16Regular />}
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            className="text-foreground flex h-full w-11 items-center justify-center transition-colors hover:bg-red-600 hover:text-white"
          >
            <Dismiss16Regular />
          </button>
        </div>
      </div>
    </div>
  );
}
