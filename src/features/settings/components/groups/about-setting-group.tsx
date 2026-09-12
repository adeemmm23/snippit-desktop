import { openUrl } from "@tauri-apps/plugin-opener";

import SettingGroup from "../ui/setting-group";

export default function AboutSettingGroup() {
  return (
    <SettingGroup title="Snippit">
      <p className="text-muted-foreground text-sm">
        Snippit is a simple snippet manager built with React and Tailwind CSS.
        It allows you to easily save, organize, and manage your templates
        snippets in one place. You can visit the{" "}
        <a
          href="https://github.com/adeemmm23/snippit-desktop"
          onClick={(e) => {
            e.preventDefault();
            openUrl("https://github.com/adeemmm23/snippit-desktop");
          }}
          target="_blank"
          rel="noreferrer"
          className="text-primary"
        >
          GitHub repository
        </a>{" "}
        to learn more.
      </p>
      <img
        src="/logo.svg"
        alt="Snippit Desktop Logo"
        className="mt-2 w-10"
        draggable="false"
      />
    </SettingGroup>
  );
}
