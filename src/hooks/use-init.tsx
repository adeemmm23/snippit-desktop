import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";

export function useInit() {
  useEffect(() => {
    invoke("show_window");
  }, []);
}
