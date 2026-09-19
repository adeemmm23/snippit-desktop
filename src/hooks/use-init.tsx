import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";

export function useInit() {
  useEffect(() => {
    const appWindow = getCurrentWindow();
    appWindow.show();
  }, []);
}
