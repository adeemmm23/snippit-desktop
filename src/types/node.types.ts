export type Collection = {
  id: string;
  name: string;
  files: NodeType[];
};

export type FileType = {
  id: string;
  type: "file";
  name: string;
  content: string;
};

export type FolderType = {
  id: string;
  type: "folder";
  name: string;
  files: NodeType[];
};

export type NodeType = FileType | FolderType;

export function isFile(item: NodeType): item is FileType {
  return item.type === "file";
}

export function isFolder(item: NodeType): item is FolderType {
  return item.type === "folder";
}
