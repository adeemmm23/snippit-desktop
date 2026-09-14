import {
  Subtract16Regular,
  SquareMultiple16Regular,
  Maximize16Regular,
  Dismiss16Regular,
} from "@fluentui/react-icons";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

export default function WindowControls() {
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
    <div className="z-999 flex h-full items-center">
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
  );
}
