import { useCollectionNodes } from "@/hooks/use-collection-nodes";
import { useEditorStore } from "@/stores/editor/editor-store";
import { useFilesStore } from "@/stores/files/files-store";
import { getFileContent } from "@/utils/files.utils";

export default function SaveIndicator() {
  const activeFileId = useFilesStore((state) => state.activeFileId);
  const { local } = useCollectionNodes();
  const template = useEditorStore((state) => state.template);

  // Only local files can be saved; public ones are read-only, so no dot for them.
  const saved = activeFileId === null ? null : getFileContent(local, activeFileId);
  const isUnsaved = saved !== null && saved !== template;

  return (
    <span
      data-open={isUnsaved ? "true" : undefined}
      data-closed={!isUnsaved ? "true" : undefined}
      className="data-open:animate-in data-open:fade-in-0 data-open:zoom-in-75 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-75 fill-mode-forwards absolute top-1.5 right-1.5 size-1 duration-200"
    >
      <span className="bg-primary block size-full animate-pulse rounded-full" />
    </span>
  );
}
