import { isFolder, type NodeType } from "@/types/node.types";
import { getNodeContent } from "@/utils/files.utils";

export const getAvailableName = (
  items: NodeType[],
  baseName: string,
): string => {
  if (!items.find((item) => item.name === baseName)) {
    return baseName;
  }

  let counter = 1;
  let finalName = baseName;

  while (items.find((item) => item.name === finalName)) {
    finalName = `${baseName} ${counter}`;
    counter++;
  }

  return finalName;
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj)) as T;
};

export const isDeepEqual = <T>(obj1: T, obj2: T): boolean => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

/** True if `path` is `prefix` itself or lives somewhere underneath it. */
export const startsWithPath = (path: string[], prefix: string[]) =>
  prefix.length <= path.length &&
  prefix.every((segment, i) => path[i] === segment);

/**
 * Re-points `path` after the node at `from` moved/renamed to `to`.
 * Paths inside the moved node keep their tail; unrelated paths are returned as-is.
 * e.g. from ["A"], to ["B"]: ["A","x"] -> ["B","x"], ["C"] -> ["C"]
 */
export const remapPath = (path: string[], from: string[], to: string[]) =>
  startsWithPath(path, from) ? [...to, ...path.slice(from.length)] : path;

/**
 * The list of nodes directly inside `parentPath` ([] = collection root).
 * Returns null if the path doesn't point to an existing folder.
 */
export const getChildren = (
  files: NodeType[],
  parentPath: string[],
): NodeType[] | null => {
  if (parentPath.length === 0) return files;
  const parent = getNodeContent(parentPath, files);
  return parent && isFolder(parent) ? parent.files : null;
};
