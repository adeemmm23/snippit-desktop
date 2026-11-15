import {
  buildChildrenIndex,
  generateId,
  getAvailableName,
  getDescendantIds,
  isInside,
} from "./files.utils";

import {
  isFolder,
  type NodeMap,
  type NodeType,
} from "@/types/node.types";

/*
 * Every function here is pure: it never touches the map it receives and
 * returns a new one (or `null` when the request doesn't make sense). Callers
 * keep the result only when it isn't `null`. Nodes are addressed by id, and
 * `null` as a parent id means the collection root.
 */

const siblingsOf = (
  nodes: NodeMap,
  parentId: string | null,
  exceptId?: string,
): NodeType[] =>
  Object.values(nodes).filter(
    (node) => node.parentId === parentId && node.id !== exceptId,
  );

const isValidParent = (nodes: NodeMap, parentId: string | null) =>
  parentId === null || nodes[parentId]?.type === "folder";

/** Creates an empty file or folder. */
export const createNode = (
  nodes: NodeMap,
  parentId: string | null,
  type: NodeType["type"],
  name: string,
  content = "",
): { nodes: NodeMap; id: string } | null => {
  const trimmed = name.trim();
  if (!trimmed || !isValidParent(nodes, parentId)) return null;

  const id = generateId();
  const now = Date.now();
  const finalName = getAvailableName(siblingsOf(nodes, parentId), trimmed, type);

  const node: NodeType =
    type === "file"
      ? { id, parentId, type, name: finalName, content, createdAt: now, updatedAt: now }
      : { id, parentId, type, name: finalName, createdAt: now, updatedAt: now };

  return { nodes: { ...nodes, [id]: node }, id };
};

/** Moves a node into another folder. Refuses to move a folder into itself or its own children. */
export const moveNode = (
  nodes: NodeMap,
  id: string,
  targetParentId: string | null,
): NodeMap | null => {
  const node = nodes[id];
  if (!node || node.parentId === targetParentId) return null;
  if (!isValidParent(nodes, targetParentId)) return null;
  if (targetParentId !== null && isInside(nodes, targetParentId, id)) return null;

  const name = getAvailableName(
    siblingsOf(nodes, targetParentId, id),
    node.name,
    node.type,
  );

  return { ...nodes, [id]: { ...node, parentId: targetParentId, name } };
};

/** Renames a node in place. The node itself doesn't count as a name clash. */
export const renameNode = (
  nodes: NodeMap,
  id: string,
  newName: string,
): NodeMap | null => {
  const node = nodes[id];
  const trimmed = newName.trim();
  if (!node || !trimmed) return null;

  const name = getAvailableName(
    siblingsOf(nodes, node.parentId, id),
    trimmed,
    node.type,
  );
  if (name === node.name) return null;

  return {
    ...nodes,
    [id]: { ...node, name, updatedAt: Date.now() },
  };
};

/** Removes a node and everything below it. `removed` lists every id that went. */
export const removeNode = (
  nodes: NodeMap,
  id: string,
): { nodes: NodeMap; removed: Set<string> } | null => {
  if (!nodes[id]) return null;

  const removed = new Set([
    id,
    ...getDescendantIds(buildChildrenIndex(nodes), id),
  ]);
  const next = { ...nodes };
  for (const removedId of removed) delete next[removedId];

  return { nodes: next, removed };
};

/**
 * A node and everything below it as a stand-alone map: the node becomes a
 * root (`parentId: null`) and the rest keeps its structure.
 */
export const extractSubtree = (nodes: NodeMap, id: string): NodeMap => {
  const root = nodes[id];
  if (!root) return {};

  const result: NodeMap = { [id]: { ...root, parentId: null } };
  for (const descendantId of getDescendantIds(buildChildrenIndex(nodes), id)) {
    result[descendantId] = nodes[descendantId];
  }

  return result;
};

/**
 * Copies a stand-alone map (see `extractSubtree`, `fromTree`) into a folder.
 * Every copied node gets a new id, so the same thing can be added any number
 * of times, and roots are renamed when they clash.
 */
export const attachNodes = (
  nodes: NodeMap,
  parentId: string | null,
  incoming: NodeMap,
): NodeMap | null => {
  const entries = Object.values(incoming);
  if (entries.length === 0 || !isValidParent(nodes, parentId)) return null;

  const newIds = new Map(entries.map((node) => [node.id, generateId()]));
  const result: NodeMap = { ...nodes };
  const rootSiblings = siblingsOf(nodes, parentId);

  for (const node of entries) {
    const isRoot = node.parentId === null || !newIds.has(node.parentId);
    const id = newIds.get(node.id)!;

    const name = isRoot
      ? getAvailableName(rootSiblings, node.name, node.type)
      : node.name;

    const copy: NodeType = {
      ...node,
      id,
      name,
      parentId: isRoot ? parentId : newIds.get(node.parentId!)!,
    };

    if (isRoot) rootSiblings.push(copy);
    result[id] = copy;
  }

  return result;
};

/**
 * Makes sure the folders in `names` exist (creating the missing ones) and
 * returns the id of the last one, `null` for the root. Files that happen to
 * share a name with a folder are ignored.
 */
export const ensureFolderPath = (
  nodes: NodeMap,
  names: string[],
): { nodes: NodeMap; id: string | null; changed: boolean } => {
  let result = nodes;
  let parentId: string | null = null;
  let changed = false;

  for (const name of names) {
    const existing: NodeType | undefined = Object.values(result).find(
      (node) => isFolder(node) && node.parentId === parentId && node.name === name,
    );

    if (existing) {
      parentId = existing.id;
      continue;
    }

    const created = createNode(result, parentId, "folder", name);
    if (!created) return { nodes, id: null, changed: false };

    result = created.nodes;
    parentId = created.id;
    changed = true;
  }

  return { nodes: result, id: parentId, changed };
};

/** Applies `change` to the content of every file. */
export const mapFileContent = (
  nodes: NodeMap,
  change: (content: string) => string,
): NodeMap => {
  const result: NodeMap = {};

  for (const [id, node] of Object.entries(nodes)) {
    result[id] = node.type === "file" ? { ...node, content: change(node.content) } : node;
  }

  return result;
};
