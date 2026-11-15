type BaseNode = {
  id: string;
  /** The folder this node lives in. `null` means the collection root. */
  parentId: string | null;
  name: string;
  updatedAt?: string;
  createdAt?: string;
};

export type FileType = BaseNode & {
  type: "file";
  content: string;
};

export type FolderType = BaseNode & {
  type: "folder";
};

export type NodeType = FileType | FolderType;

/** Every node of a collection, by id. This is what gets stored. */
export type NodeMap = Record<string, NodeType>;

export type Collection = {
  id: string;
  name: string;
  nodes: NodeMap;
  updatedAt?: string;
  createdAt?: string;
};

/**
 * The nested shape used by export files, import files and public collection
 * files.
 */
export type TreeNode = {
  type: "file" | "folder";
  name: string;
  content?: string;
  files?: TreeNode[];
};

/**
 * Where an item shown in the tree comes from. This is a property of the view,
 * not of the data, so it never gets stored on the nodes themselves.
 */
export type Origin = "local" | "public";

export type TreeItem = {
  node: NodeType;
  origin: Origin;
};

export function isFile(item: NodeType): item is FileType {
  return item.type === "file";
}

export function isFolder(item: NodeType): item is FolderType {
  return item.type === "folder";
}
