import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

import type { TreeNode } from "@/types/node.types";

/**
 * Asks where to save, then writes the export file. Resolves to `false` when
 * the save dialog is cancelled.
 */
export const saveExportFile = async (
  defaultFileName: string,
  files: TreeNode[],
): Promise<boolean> => {
  const filePath = await save({
    defaultPath: defaultFileName,
    filters: [{ name: "JSON Files", extensions: ["json"] }],
  });

  if (!filePath) return false;

  // The export file keeps the nested format, so it stays readable and
  // works as a public collection file.
  await writeTextFile(filePath, JSON.stringify({ files }, null, 2));

  return true;
};
