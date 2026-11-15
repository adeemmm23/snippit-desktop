import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import SettingGroup from "../ui/setting-group";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/ui/button";

export default function ResetSettingGroup() {
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    setLoading(true);
    localStorage.clear();
    location.reload();
  };

  return (
    <SettingGroup title="Reset">
      <p className="text-muted-foreground text-sm">
        Clear all app data stored in your browser. This action cannot be undone.
      </p>
      <ConfirmDialog
        title="Reset Snippit"
        description="This will remove all stored app data from your browser."
        trigger={
          <Button variant="destructive" className="w-fit">
            <HugeiconsIcon icon={Loading03Icon} />
            Reset Snippit
          </Button>
        }
        destructive
        onConfirm={handleConfirm}
        loading={loading}
      />
    </SettingGroup>
  );
}
