import { useCallback } from "react";

import { useCollectionNodes } from "./use-collection-nodes";

import { useEditorStore } from "@/stores/editor/editor-store";
import { useFilesStore } from "@/stores/files/files-store";
import { getFileContent } from "@/utils/files.utils";

/** Opens a file (local or public) in the editor by its id. */
export function useOpenFile() {
  const { local, publicNodes } = useCollectionNodes();
  const setTemplate = useEditorStore((state) => state.setTemplate);
  const setActiveFile = useFilesStore((state) => state.setActiveFile);

  return useCallback(
    (id: string) => {
      const content =
        getFileContent(local, id) ??
        (publicNodes ? getFileContent(publicNodes, id) : null);

      if (content === null) return;

      setTemplate(content);
      setActiveFile(id);
    },
    [local, publicNodes, setTemplate, setActiveFile],
  );
}
