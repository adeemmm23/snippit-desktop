import { useEffect, useState } from "react";

import { useCollectionNodes } from "@/hooks/use-collection-nodes";
import { useFilesStore } from "@/stores/files/files-store";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/ui/breadcrumb";
import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { getAncestry } from "@/utils/files.utils";

export default function FilePath() {
  const activeFileId = useFilesStore((state) => state.activeFileId);
  const { local, publicNodes } = useCollectionNodes();
  const setCurrentWorkingFolder = useFilesStore(
    (state) => state.setCurrentFolder,
  );

  const [viewMode, setViewMode] = useState<"full" | "medium" | "small">("full");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setViewMode("full");
      } else if (window.innerWidth >= 768) {
        setViewMode("medium");
      } else {
        setViewMode("small");
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // The open file can be a local or a public one; either way the folders above
  // it come straight from its parent chain, no path is stored anywhere.
  const chain =
    activeFileId === null
      ? []
      : (() => {
          const own = getAncestry(local, activeFileId);
          return own.length > 0
            ? own
            : publicNodes
              ? getAncestry(publicNodes, activeFileId)
              : [];
        })();

  const file = chain.at(-1)?.name ?? null;
  const folders = chain.slice(0, -1).map(({ id, name }) => ({ id, name }));
  const parentId = folders.at(-1)?.id ?? null;

  if (!file) {
    return (
      <Breadcrumb className="group fade-in animate-in flex h-9 items-center py-1 opacity-30 transition-opacity duration-500 ease-in-out group-hover:opacity-100">
        <BreadcrumbList>
          <BreadcrumbItem className="select-none">
            <BreadcrumbLink className="max-w-40 truncate text-sm">
              No file is opened
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  if (viewMode === "small") {
    return (
      <Breadcrumb className="fade-in animate-in flex h-9 items-center py-1 opacity-30 transition-opacity duration-500 ease-in-out hover:opacity-100">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage
              onClick={() => setCurrentWorkingFolder(parentId)}
              className="max-w-40 truncate text-sm select-none"
              title={file}
            >
              {file}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Full width shows the parent folder next to the file and hides the rest
  // in the dropdown; medium width puts every folder in the dropdown.
  const parenFolder = viewMode === "full" ? (folders.at(-1) ?? null) : null;
  const dropdownSegments =
    viewMode === "full" ? folders.slice(0, -1) : folders;

  return (
    <Breadcrumb className="fade-in animate-in flex h-9 items-center py-1 opacity-30 transition-opacity duration-500 ease-in-out hover:opacity-100">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => setCurrentWorkingFolder(null)}
            className="max-w-40 truncate text-sm select-none"
          >
            Root
          </BreadcrumbLink>
        </BreadcrumbItem>

        {dropdownSegments.length > 0 && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button size="icon-sm" variant="ghost">
                      <BreadcrumbEllipsis />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-50">
                  <DropdownMenuGroup>
                    {dropdownSegments.map((segment) => (
                      <DropdownMenuItem
                        key={segment.id}
                        render={
                          <BreadcrumbLink
                            title={segment.name}
                            className="truncate"
                            onClick={() => setCurrentWorkingFolder(segment.id)}
                          >
                            {segment.name}
                          </BreadcrumbLink>
                        }
                      />
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
          </>
        )}

        {parenFolder && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => setCurrentWorkingFolder(parentId)}
                className="max-w-40 truncate text-sm select-none"
                title={parenFolder.name}
              >
                {parenFolder.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}

        <BreadcrumbSeparator />

        <BreadcrumbItem>
          <BreadcrumbPage
            onClick={() => setCurrentWorkingFolder(parentId)}
            className="max-w-40 truncate text-sm select-none"
            title={file}
          >
            {file}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
