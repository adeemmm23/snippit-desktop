import {
  isFile,
  isFolder,
  type NodeMap,
  type NodeType,
  type TreeNode,
} from "@/types/node.types";

export const generateId = (): string => crypto.randomUUID();

/* -------------------------------------------------------------------------- */
/*                                   Reading                                  */
/* -------------------------------------------------------------------------- */

/** parentId -> children. `null` is the root. */
export type ChildrenIndex = Map<string | null, NodeType[]>;

/** A collection's nodes together with the index that lists a folder's children. */
export type NodeTree = { nodes: NodeMap; children: ChildrenIndex };

export const buildChildrenIndex = (nodes: NodeMap): ChildrenIndex => {
  const index: ChildrenIndex = new Map();

  for (const node of Object.values(nodes)) {
    const list = index.get(node.parentId);
    if (list) list.push(node);
    else index.set(node.parentId, [node]);
  }

  return index;
};

/** Build once per change (in a `useMemo`), then every "list this folder" is a lookup. */
export const makeNodeTree = (nodes: NodeMap): NodeTree => ({
  nodes,
  children: buildChildrenIndex(nodes),
});

/** The chain from the root down to the node, the node included. Empty if the id doesn't exist. */
export const getAncestry = (nodes: NodeMap, id: string): NodeType[] => {
  const chain: NodeType[] = [];
  const seen = new Set<string>();
  let node: NodeType | undefined = nodes[id];

  // `seen` only guards against corrupt data where parents form a loop.
  while (node && !seen.has(node.id)) {
    seen.add(node.id);
    chain.unshift(node);
    node = node.parentId === null ? undefined : nodes[node.parentId];
  }

  return chain;
};

/** True if `id` is `ancestorId` itself or lives anywhere below it. */
export const isInside = (
  nodes: NodeMap,
  id: string,
  ancestorId: string,
): boolean => getAncestry(nodes, id).some((node) => node.id === ancestorId);

/** Every id below a node, the node itself not included. */
export const getDescendantIds = (
  children: ChildrenIndex,
  id: string,
): string[] => {
  const ids: string[] = [];
  const stack = [id];

  while (stack.length > 0) {
    for (const child of children.get(stack.pop()!) ?? []) {
      ids.push(child.id);
      if (isFolder(child)) stack.push(child.id);
    }
  }

  return ids;
};

/**
 * Walks folders by name. Only needed to line up a local folder with its public
 * counterpart, which have different ids but the same place in the tree.
 * Returns the folder's id (`null` for the root, i.e. empty `names`) or
 * `undefined` when a folder along the way doesn't exist.
 */
export const findFolderByNames = (
  tree: NodeTree,
  names: string[],
): string | null | undefined => {
  let parentId: string | null = null;

  for (const name of names) {
    const folder: NodeType | undefined = tree.children
      .get(parentId)
      ?.find((node) => isFolder(node) && node.name === name);
    if (!folder) return undefined;

    parentId = folder.id;
  }

  return parentId;
};

/** A file's content, or `null` when the id is missing or is a folder. */
export const getFileContent = (nodes: NodeMap, id: string): string | null => {
  const node = nodes[id];
  return node && isFile(node) ? node.content : null;
};

/* -------------------------------------------------------------------------- */
/*                                   Naming                                   */
/* -------------------------------------------------------------------------- */

/**
 * A name that is free among `siblings` of the same type, so a file and a
 * folder are allowed to share a name.
 */
export const getAvailableName = (
  siblings: NodeType[],
  baseName: string,
  type: NodeType["type"],
): string => {
  const taken = new Set(
    siblings.filter((node) => node.type === type).map((node) => node.name),
  );

  let name = baseName;
  for (let counter = 1; taken.has(name); counter++) {
    name = `${baseName} ${counter}`;
  }

  return name;
};

/* -------------------------------------------------------------------------- */
/*                  Untrusted data, file formats, public ids                  */
/* -------------------------------------------------------------------------- */

type IdFactory = (trail: string[], type: NodeType["type"]) => string;

/**
 * Turns untrusted nested data (an import file, a public collection file) into
 * nodes. Invalid entries are dropped, unknown fields are removed, names that
 * clash within a folder get a suffix, and every node gets the id `makeId`
 * returns for it. `trail` is the list of names from the root down to the node.
 * Top level nodes get `parentId: null`.
 */
export const fromTree = (
  raw: unknown,
  makeId: IdFactory,
  parentId: string | null = null,
  trail: string[] = [],
  out: NodeMap = {},
): NodeMap => {
  if (!Array.isArray(raw)) return out;

  const taken: NodeType[] = [];

  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;

    const { type, name, content, files } = entry as Record<string, unknown>;
    if (type !== "file" && type !== "folder") continue;
    if (typeof name !== "string" || name.trim() === "") continue;

    const finalName = getAvailableName(taken, name.trim(), type);
    const nodeTrail = [...trail, finalName];
    const id = makeId(nodeTrail, type);
    const now = Date.now();

    const node: NodeType =
      type === "file"
        ? {
            id,
            parentId,
            type,
            name: finalName,
            content: typeof content === "string" ? content : "",
            updatedAt: now,
            createdAt: now,
          }
        : {
            id,
            parentId,
            type,
            name: finalName,
            updatedAt: now,
            createdAt: now,
          };

    taken.push(node);
    out[id] = node;

    if (type === "folder") fromTree(files, makeId, id, nodeTrail, out);
  }

  return out;
};

/** Nodes -> nested data, for export. Ids are left out: importing gives new ones anyway. */
export const toTree = (nodes: NodeMap): TreeNode[] => {
  const children = buildChildrenIndex(nodes);

  const walk = (parentId: string | null): TreeNode[] =>
    (children.get(parentId) ?? []).map((node) =>
      isFolder(node)
        ? { type: "folder", name: node.name, files: walk(node.id) }
        : { type: "file", name: node.name, content: node.content },
    );

  return walk(null);
};

/**
 * Ids for nodes that come from a public collection file. They are built from
 * the file and the names, so they stay the same every time the file is
 * reloaded, and they can never equal a local id. The type is part of the id
 * because a file and a folder may share a name.
 */
export const makePublicIdFactory =
  (filePath: string): IdFactory =>
  (trail, type) =>
    `public:${filePath}/${trail.join("/")}#${type}`;

/** True for ids made by `makePublicIdFactory`. `null` (the root) is not public. */
export const isPublicId = (id: string | null): boolean =>
  id !== null && id.startsWith("public:");

/* -------------------------------------------------------------------------- */
/*                                   Search                                   */
/* -------------------------------------------------------------------------- */

export type IndexedFile = {
  id: string;
  name: string;
  /** Names from the root down to the file, joined with "/". */
  path: string;
};

/** Every file, flattened for searching. Content is not included. */
export const indexFiles = (nodes: NodeMap): IndexedFile[] =>
  Object.values(nodes)
    .filter(isFile)
    .map((file) => ({
      id: file.id,
      name: file.name,
      path: getAncestry(nodes, file.id)
        .map((node) => node.name)
        .join("/"),
    }));
