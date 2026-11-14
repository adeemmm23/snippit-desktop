export type Collection = {
  id: string;
  name: string;
  files: Node[];
  updatedAt?: string;
  createdAt?: string;
};

type Base = {
  id: string;
  type: "file" | "folder";
  name: string;
  isPublic?: boolean;
  updatedAt?: string;
  createdAt?: string;
};

export type File = Base & {
  type: "file";
  content: string;
};

export type Folder = Base & {
  type: "folder";
  files: Node[];
};

export type Node = File | Folder;

export function isFile(item: Node): item is File {
  return item.type === "file";
}

export function isFolder(item: Node): item is Folder {
  return item.type === "folder";
}
