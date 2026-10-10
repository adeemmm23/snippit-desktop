import {
  Add01Icon,
  ArrowLeft01Icon,
  Edit02Icon,
  Globe02Icon,
  Search,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

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
}

const INITIAL_LINKS: LinkItem[] = [
  { id: "1", title: "Facebook", url: "https://www.facebook.com" },
  { id: "2", title: "GitHub", url: "https://github.com" },
  { id: "3", title: "YouTube", url: "https://www.youtdube.com" },
  { id: "32", title: "X (Twitter)", url: "https://xd.com" },
  { id: "32132", title: "GitHub", url: "https://gitzhub.com" },
  { id: "2141", title: "YouTube", url: "https://www.yodzutube.com" },
  { id: "42141", title: "X (Twitter)", url: "https://dzax.com" },
  { id: "24343", title: "GitHub", url: "https://githudazb.com" },
  { id: "324252", title: "YouTube", url: "https://www.youdzazdatube.com" },
  { id: "53543", title: "X (Twitter)", url: "https://dzx.com" },
  { id: "34634563", title: "GitHub", url: "https://githdadazub.com" },
  { id: "534354", title: "YouTube", url: "https://www.youdazdatube.com" },
  { id: "54345", title: "X (Twitter)", url: "https://xds.com" },
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
  const [view, setView] = useState<"list" | "add">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [links, setLinks] = useState<LinkItem[]>(INITIAL_LINKS);

  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const filteredLinks = links.filter(
    (link) =>
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const formattedUrl = newUrl.startsWith("http")
      ? newUrl
      : `https://${newUrl}`;

    setLinks([
      ...links,
      {
        id: Date.now().toString(),
        title: newTitle.trim(),
        url: formattedUrl,
      },
    ]);

    setNewTitle("");
    setNewUrl("");
    setView("list");
  };

  return (
    <PopoverContent className="flex h-100 w-80 flex-col gap-2 p-2">
      {view === "list" ? (
        <>
          <InputGroup>
            <InputGroupInput
              placeholder="Search or add a link..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setNewTitle(searchQuery);
                  setNewUrl(searchQuery.includes(".") ? searchQuery : "");
                  setView("add");
                }
              }}
            />
            <InputGroupAddon>
              <HugeiconsIcon icon={Search} className="size-4" />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setView("add")}
              >
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
              </Button>
            </InputGroupAddon>
          </InputGroup>

          {/* Links List */}
          <ScrollArea className="min-h-0 flex-1 grow">
            <div className="flex flex-col gap-1">
              {filteredLinks.map((link) => {
                const domain = new URL(link.url).hostname;
                return (
                  <Item
                    key={link.id}
                    size="sm"
                    className="hover:bg-input/10 cursor-pointer flex-nowrap select-none"
                    role="button"
                    onClick={() => window.open(link.url, "_blank")}
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
        /* Add Link View Form using shadcn Input & Label */
        <form
          onSubmit={handleAddLink}
          className="flex h-full flex-col justify-between"
        >
          <div className="flex flex-col gap-3">
            <div className="flex h-9 items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setView("list")}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              </Button>
              <span className="text-foreground/80 text-sm">Add New Link</span>
              <div className="size-8" />
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
          </div>

          <Button type="submit" size="sm" className="mt-4 w-full">
            Save Link
          </Button>
        </form>
      )}
    </PopoverContent>
  );
}
