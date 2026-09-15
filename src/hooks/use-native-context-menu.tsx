import { Menu, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { useEffect, useRef } from "react";

export function useNativeContextMenu() {
  const menuRef = useRef<Menu | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMenu() {
      try {
        const cutItem = await PredefinedMenuItem.new({ item: "Cut" });
        const copyItem = await PredefinedMenuItem.new({ item: "Copy" });
        const pasteItem = await PredefinedMenuItem.new({ item: "Paste" });
        const selectAllItem = await PredefinedMenuItem.new({
          item: "SelectAll",
        });
        const separator = await PredefinedMenuItem.new({ item: "Separator" });

        const menu = await Menu.new({
          items: [cutItem, copyItem, pasteItem, separator, selectAllItem],
        });
        if (isMounted) {
          menuRef.current = menu;
        }
      } catch (error) {
        console.error("Failed to initialize native context menu:", error);
      }
    }

    initMenu();

    const handleContextMenu = async (e: MouseEvent) => {
      // Only prevent the default browser menu if our Tauri menu successfully loaded
      if (menuRef.current) {
        e.preventDefault();
        await menuRef.current.popup();
      }
    };

    // Attach the listener globally to the entire window
    window.addEventListener("contextmenu", handleContextMenu);

    // Cleanup the listener when the component unmounts
    return () => {
      isMounted = false;
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
}
