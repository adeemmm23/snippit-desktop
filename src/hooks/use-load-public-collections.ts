import { useEffect } from "react";
import { toast } from "sonner";

import { useFilesStore } from "@/stores/files/files-store";
import { usePublicCollectionsStore } from "@/stores/public/public-store";
import useSettingsStore from "@/stores/settings/settings-store";

/** Reloads the public collection files whenever the collection or the enabled list changes. */
export function useLoadPublicCollections() {
  const activeCollection = useFilesStore((state) => state.activeCollection);
  const publicCollectionPaths = useSettingsStore(
    (state) => state.publicCollections,
  );

  useEffect(() => {
    toast.loading("Loading public collections", {
      id: "public-collections-loading",
    });

    usePublicCollectionsStore
      .getState()
      .loadPublicCollections()
      .finally(() => {
        setTimeout(() => toast.dismiss("public-collections-loading"), 1000);
      });
  }, [activeCollection, publicCollectionPaths]);
}
