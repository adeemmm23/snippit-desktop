import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useSections } from "../context/sections-context";

import { Button } from "@/ui/button";

export default function SettingsNavigation() {
  const { sections, activeSection } = useSections();

  return (
    <aside className="flex w-1/6 flex-col gap-2">
      {sections &&
        sections.map((section) => (
          <Button
            key={section.id}
            size="sm"
            className="justify-start"
            variant={
              activeSection === section.id
                ? activeSection.toLocaleLowerCase().includes("danger")
                  ? "destructive"
                  : "default"
                : "ghost"
            }
            onClick={() => {
              const el = document.getElementById(section.id);
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            {section.title}
          </Button>
        ))}
      <Version />
    </aside>
  );
}

function Version() {
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => {
        setVersion("");
      });
  }, []);

  if (!version) {
    return null;
  }

  return (
    <button
      className="text-muted-foreground mt-auto cursor-pointer px-2.5 text-left text-xs select-none"
      onClick={() => {
        navigator.clipboard.writeText("v" + version);
        toast.success("Version copied to clipboard");
      }}
    >
      Snippit v{version}
    </button>
  );
}
