export type Collection = {
  id: string;
  name: string;
  files: NodeType[];
  updatedAt?: string;
  createdAt?: string;
};

export type FileType = {
  id: string;
  type: "file";
  name: string;
  isPublic?: boolean;
  content: string;
  updatedAt?: string;
  createdAt?: string;
};

export type FolderType = {
  id: string;
  type: "folder";
  name: string;
  isPublic?: boolean;
  files: NodeType[];
  updatedAt?: string;
  createdAt?: string;
};

export type NodeType = FileType | FolderType;

export function isFile(item: NodeType): item is FileType {
  return item.type === "file";
}

export function isFolder(item: NodeType): item is FolderType {
  return item.type === "folder";
}
