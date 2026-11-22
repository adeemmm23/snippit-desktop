import { Warning } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { useEditorStore } from "@/stores/editor/editor-store";
import { Alert, AlertDescription, AlertTitle } from "@/ui/alert";

/** Lists the mistakes found in the template syntax, nothing when it is fine. */
export default function TemplateIssues() {
  const issues = useEditorStore((state) => state.issues);

  if (issues.length === 0) return null;

  return (
    <div className="px-2">
      <Alert className="bg-card/50 select-none">
        <HugeiconsIcon icon={Warning} />
        <AlertTitle>Check your template</AlertTitle>
        <AlertDescription>
          <ul className="flex flex-col gap-1.5">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
