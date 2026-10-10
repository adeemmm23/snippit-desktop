import {
  Add01Icon,
  ArrowLeft01Icon,
  Close,
  Copy01Icon,
  Delete01Icon,
  Edit02Icon,
  Globe02Icon,
  Search,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/ui/item";
import { Label } from "@/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { ScrollArea } from "@/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  tags?: string[];
}

const INITIAL_LINKS: LinkItem[] = [
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
  { id: "32", title: "Twitter", url: "https://x.com", tags: ["Social"] },
];

export default function LinksButton() {
  return (
    <Popover>
      <Tooltip>
        <PopoverTrigger
          render={
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm">
                  <HugeiconsIcon icon={Globe02Icon} className="size-4" />
                </Button>
              }
            />
          }
        />
        <LinksPopoverContent />
        <TooltipContent side="bottom">
          <p>Links</p>
        </TooltipContent>
      </Tooltip>
    </Popover>
  );
}

function LinksPopoverContent() {
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [links, setLinks] = useState<LinkItem[]>(INITIAL_LINKS);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [newTags, setNewTags] = useState<string[]>(["Internet"]);

  const filteredLinks = links.filter(
    (link) =>
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();
      if (newTags.length >= 3) return;
      if (!newTags.includes(newTagInput.trim())) {
        setNewTags([...newTags, newTagInput.trim()]);
      }
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTags(newTags.filter((tag) => tag !== tagToRemove));
  };

  const openAddView = () => {
    setNewTitle(searchQuery);
    setNewUrl(searchQuery.includes(".") ? searchQuery : "");
    setNewTagInput("");
    setNewTags(["Internet"]);
    setEditingId(null);
    setView("add");
  };

  const openEditView = (link: LinkItem) => {
    setEditingId(link.id);
    setNewTitle(link.title);
    setNewUrl(link.url);
    setNewTagInput("");
    setNewTags(
      link.tags && link.tags.length > 0 ? [...link.tags] : ["Internet"],
    );
    setView("edit");
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const formattedUrl = newUrl.startsWith("http")
      ? newUrl
      : `https://${newUrl}`;

    if (view === "edit" && editingId) {
      setLinks(
        links.map((link) =>
          link.id === editingId
            ? {
                ...link,
                title: newTitle.trim(),
                url: formattedUrl,
                tags: newTags,
              }
            : link,
        ),
      );
    } else {
      setLinks([
        ...links,
        {
          id: Date.now().toString(),
          title: newTitle.trim(),
          url: formattedUrl,
          tags: newTags,
        },
      ]);
    }

    setNewTitle("");
    setNewUrl("");
    setNewTagInput("");
    setNewTags(["Internet"]);
    setEditingId(null);
    setView("list");
  };

  const handleCopy = async (link: string) => {
    await navigator.clipboard.writeText(link);

    toast.success("Copied successfully", {
      icon: <HugeiconsIcon icon={Copy01Icon} className="size-4" />,
    });
  };

  const handleDelete = () => {
    if (!editingId) return;
    setLinks(links.filter((link) => link.id !== editingId));

    setNewTitle("");
    setNewUrl("");
    setNewTagInput("");
    setNewTags(["Internet"]);
    setEditingId(null);
    setView("list");
  };

  return (
    <PopoverContent className="flex h-100 w-80 flex-col gap-2 p-2">
      {view === "list" ? (
        <>
          <InputGroup className="has-[[data-slot=input-group-control]:focus-visible]:border-border">
            <InputGroupInput
              placeholder="Search or add a link..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  openAddView();
                }
              }}
            />
            <InputGroupAddon>
              <HugeiconsIcon icon={Search} className="size-4" />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Button variant="ghost" size="icon-xs" onClick={openAddView}>
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
              </Button>
            </InputGroupAddon>
          </InputGroup>

          <ScrollArea className="min-h-0 flex-1 grow">
            <div className="flex flex-col gap-1">
              {filteredLinks.map((link) => {
                let domain = "";
                try {
                  domain = new URL(link.url).hostname;
                } catch {
                  domain = link.url;
                }

                return (
                  <Item
                    key={link.id}
                    size="sm"
                    className="hover:bg-input/10 group/item cursor-pointer flex-nowrap select-none"
                    role="button"
                    onClick={async () => {
                      try {
                        handleCopy(link.url);
                      } catch (err) {
                        console.error("Failed to copy to clipboard:", err);
                      }
                    }}
                  >
                    <ItemMedia>
                      <img
                        src={`https://${domain}/favicon.ico`}
                        alt={`${link.title} favicon`}
                        className="size-4 rounded-xs"
                        onError={(e) => {
                          e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                        }}
                      />
                    </ItemMedia>
                    <ItemContent className="gap-0 overflow-hidden">
                      <ItemTitle className="truncate">{link.title}</ItemTitle>
                      <ItemDescription className="truncate">
                        {link.url}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 group-hover/item:pointer-events-auto group-hover/item:opacity-100"
                        onClick={() => openEditView(link)}
                      >
                        <HugeiconsIcon icon={Edit02Icon} className="size-4" />
                      </Button>
                    </ItemActions>
                  </Item>
                );
              })}
            </div>
          </ScrollArea>
        </>
      ) : (
        <form
          onSubmit={handleSaveLink}
          className="flex h-full flex-col justify-between"
        >
          <div className="flex flex-col gap-4">
            <div className="flex h-9 items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setView("list")}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              </Button>
              <span className="text-foreground/80 text-sm select-none">
                {view === "edit" ? "Edit Link" : "Add Link"}
              </span>
              {view === "edit" ? (
                <Button size="icon-sm" variant="ghost" onClick={handleDelete}>
                  <HugeiconsIcon icon={Delete01Icon} className="size-4" />
                </Button>
              ) : (
                <div className="w-8" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="link-title">Title</Label>
              <Input
                id="link-title"
                placeholder="Google"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://google.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tags">
                  Tags {newTags.length >= 3 && "(Max 3 reached)"}
                </Label>
                <Input
                  id="tags"
                  placeholder={
                    newTags.length >= 3
                      ? "Max 3 tags allowed"
                      : "Type and press Enter..."
                  }
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  disabled={newTags.length >= 3}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {newTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="ghost"
                    className="bg-input/20 flex cursor-pointer items-center gap-1 select-none"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <HugeiconsIcon icon={Close} className="size-3" />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Button
            type="submit"
            size="sm"
            className="mt-4 w-full"
            variant="outline"
          >
            {view === "edit" ? "Save Changes" : "Save Link"}
          </Button>
        </form>
      )}
    </PopoverContent>
  );
}
