import { useEditorStore } from "@/stores/editor/editor-store";
import { useFilesStore } from "@/stores/files/files-store";
import { isFile } from "@/types/node.types";
import { getNodeContent } from "@/utils/files.utils";

export default function SaveIndicator() {
  const activeFilePath = useFilesStore((state) => state.activeFile);
  const collections = useFilesStore((state) => state.collections);
  const activeCollection = useFilesStore((state) => state.activeCollection);
  const files =
    collections.find((c) => c.name === activeCollection)?.files || [];

  const node = getNodeContent(activeFilePath, files);
  const template = useEditorStore((state) => state.template);

  const isUnsaved = Boolean(node && isFile(node) && node.content !== template);

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
