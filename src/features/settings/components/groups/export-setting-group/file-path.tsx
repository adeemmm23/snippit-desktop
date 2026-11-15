import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
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

type FilePathProps = {
  /** Folders from the root down to the one being browsed. */
  crumbs: { id: string; name: string }[];
  /** `null` goes back to the root. */
  onNavigate: (folderId: string | null) => void;
};

export default function FilePath({ crumbs, onNavigate }: FilePathProps) {
  const parenFolder = crumbs.at(-1) ?? null;
  const rest = crumbs.slice(0, -1);

  return (
    <Breadcrumb className="flex h-8 items-center px-2">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => onNavigate(null)}
            className="select-none"
          >
            Root
          </BreadcrumbLink>
        </BreadcrumbItem>
        {rest.length > 0 && (
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
                    {rest.map((segment) => (
                      <DropdownMenuItem
                        key={segment.id}
                        render={
                          <BreadcrumbLink
                            title={segment.name}
                            className="truncate"
                            onClick={() => onNavigate(segment.id)}
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
              <BreadcrumbLink className="select-none">
                {parenFolder.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
