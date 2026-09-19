import { useEffect, useState } from "react";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFilesStore } from "@/stores/files/files-store";

export default function FilePath() {
  const activeFile = useFilesStore((state) => state.activeFile);
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

  const file = activeFile.length > 0 ? activeFile[activeFile.length - 1] : null;

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
              onClick={() => setCurrentWorkingFolder(activeFile.slice(0, -1))}
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

  const showParent = viewMode === "full" && activeFile.length > 2;
  const parenFolder = showParent ? activeFile[activeFile.length - 2] : null;

  const dropdownLimit =
    viewMode === "full" ? activeFile.length - 2 : activeFile.length - 1;
  const dropdownSegments = activeFile
    .map((segment, index) => ({ segment, index }))
    .slice(0, Math.max(0, dropdownLimit));

  return (
    <Breadcrumb className="fade-in animate-in flex h-9 items-center py-1 opacity-30 transition-opacity duration-500 ease-in-out hover:opacity-100">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => setCurrentWorkingFolder([])}
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
                    {dropdownSegments.map(({ segment, index }) => (
                      <DropdownMenuItem
                        key={index}
                        render={
                          <BreadcrumbLink
                            title={segment}
                            className="truncate"
                            onClick={() =>
                              setCurrentWorkingFolder(
                                activeFile.slice(0, index + 1),
                              )
                            }
                          >
                            {segment}
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
                onClick={() => setCurrentWorkingFolder(activeFile.slice(0, -1))}
                className="max-w-40 truncate text-sm select-none"
                title={parenFolder}
              >
                {parenFolder}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}

        <BreadcrumbSeparator />

        <BreadcrumbItem>
          <BreadcrumbPage
            onClick={() => setCurrentWorkingFolder(activeFile.slice(0, -1))}
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
