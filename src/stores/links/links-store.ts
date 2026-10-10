import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { fsStorage } from "../storage";

export type LinkItem = {
  id: string;
  title: string;
  url: string;
  tags?: string[];
};

export type LinksStore = {
  links: LinkItem[];
  addLink: (linkItem: Omit<LinkItem, "id">) => void;
  editLink: (id: string, linkItem: Omit<LinkItem, "id">) => void;
  removeLink: (id: string) => void;
};

export const useLinksStore = create<LinksStore>()(
  persist(
    (set) => ({
      links: [
        {
          id: "1",
          title: "Facebook",
          url: "https://www.facebook.com",
          tags: ["Social"],
        },
        {
          id: "2",
          title: "GitHub",
          url: "https://github.com",
          tags: ["Development"],
        },
        {
          id: "3",
          title: "YouTube",
          url: "https://www.youtube.com",
          tags: ["Video"],
        },
        {
          id: "32",
          title: "X (Twitter)",
          url: "https://x.com",
          tags: ["Social"],
        },
      ],
      addLink: (linkItem) =>
        set((state) => ({
          links: [...state.links, { ...linkItem, id: Date.now().toString() }],
        })),
      editLink: (id, updatedItem) =>
        set((state) => ({
          links: state.links.map((link) =>
            link.id === id ? { ...link, ...updatedItem } : link,
          ),
        })),
      removeLink: (id) =>
        set((state) => ({
          links: state.links.filter((link) => link.id !== id),
        })),
    }),
    {
      name: "links",
      storage: createJSONStorage(() => fsStorage),
    },
  ),
);
