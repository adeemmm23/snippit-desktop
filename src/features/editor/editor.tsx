import { useDefaultLayout } from "react-resizable-panels";

import { Input } from "./input";
import { Output } from "./output";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function Editor() {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "editor-layout",
    storage: localStorage,
  });

  return (
    <ResizablePanelGroup
      defaultLayout={defaultLayout}
      onLayoutChanged={onLayoutChanged}
      orientation="vertical"
    >
      <ResizablePanel
        minSize="25%"
        defaultSize="50%"
        collapsible
        className="animate-in fade-in-0 fill-mode-backwards delay-100 duration-500 ease-in-out"
      >
        <Input />
      </ResizablePanel>
      <ResizableHandle
        className="fade-in animate-in zoom-in bg-transparent py-2 duration-500 ease-in-out"
        withHandle
      />
      <ResizablePanel
        minSize="25%"
        defaultSize="50%"
        collapsible
        className="animate-in fade-in-0 fill-mode-backwards delay-150 duration-500 ease-in-out"
      >
        <Output />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
