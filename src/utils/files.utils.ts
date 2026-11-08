import type { NodeType } from "@/types/node.types";

export const getNodeContent = (
  path: string[],
  files: NodeType[],
): NodeType | null => {
  if (path.length === 0) return null;

  let current = files;

  for (let i = 0; i < path.length - 1; i++) {
    const next = current.find((item) => item.name === path[i]);
    if (!next) return null;
    if (next.type === "file") return next;
    current = next.files;
  }

  return current.find((item) => item.name === path[path.length - 1]) ?? null;
};

export const getOrCreateNodeContent = (
  path: string[],
  files: NodeType[],
  type: "file" | "folder" = "folder",
  content: string = "",
): NodeType | null => {
  if (path.length === 0) return null;

  let current = files;

  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    let next = current.find((item) => item.name === segment);

    if (!next) {
      const now =
        Date.now().toString() + Math.random().toString(36).substring(2, 5);
      next = {
        id: now,
        type: "folder",
        name: segment,
        files: [],
      };
      current.push(next);
    }

    if (next.type === "file") return next;
    current = next.files;
  }

  const lastName = path[path.length - 1];
  let target = current.find((item) => item.name === lastName);

  if (!target) {
    const now = Date.now().toString();
    target =
      type === "file"
        ? { id: now, type: "file", name: lastName, content }
        : { id: now, type: "folder", name: lastName, files: [] };
    current.push(target);
  }

  return target;
};
