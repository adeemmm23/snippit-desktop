import { useDefaultLayout, usePanelRef } from "react-resizable-panels";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Toaster } from "@/components/ui/sonner";
import Editor from "@/features/editor";
import Files from "@/features/files";
import TitleBar from "@/features/titlebar";
import Variables from "@/features/variables";
import { useInit } from "@/hooks/use-init";
import { useNativeContextMenu } from "@/hooks/use-native-context-menu";
import { useTheme } from "@/hooks/use-theme";

export default function App() {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "main-layout",
    storage: localStorage,
  });

  const leftPanelRef = usePanelRef();
  const rightPanelRef = usePanelRef();

  useInit();
  useTheme();
  useNativeContextMenu();
  return (
    <main className="flex h-screen flex-col">
      <TitleBar leftPanelRef={leftPanelRef} rightPanelRef={rightPanelRef} />
      <ResizablePanelGroup
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
        orientation="horizontal"
        className="mb-2"
      >
        <ResizablePanel
          id="left-sidebar"
          className="fade-in animate-in slide-in-from-left-5 duration-500 ease-in-out"
          panelRef={leftPanelRef}
          defaultSize={280}
          minSize={260}
          maxSize={300}
          collapsible
          dir="rtl"
        >
          <Files />
        </ResizablePanel>
        <ResizableHandle
          className="fade-in animate-in zoom-in bg-transparent px-2 duration-500 ease-in-out"
          withHandle
          side="right"
        />
        <ResizablePanel
          id="editor"
          minSize="50%"
          className="fade-in animate-in slide-in-from-bottom-5 duration-500 ease-in-out"
        >
          <Editor />
        </ResizablePanel>
        <ResizableHandle
          className="fade-in animate-in zoom-in bg-transparent px-2 duration-500 ease-in-out"
          withHandle
          side="left"
        />
        <ResizablePanel
          id="right-sidebar"
          className="fade-in animate-in slide-in-from-right-5 duration-500 ease-in-out"
          panelRef={rightPanelRef}
          defaultSize={280}
          minSize={260}
          maxSize={300}
          collapsible
        >
          <Variables />
        </ResizablePanel>
      </ResizablePanelGroup>
      <Toaster />
    </main>
  );
}
