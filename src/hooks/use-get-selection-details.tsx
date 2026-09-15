import { useLayoutEffect, useState, useCallback, type RefObject } from "react";

export type TargetSelector =
  | string
  | HTMLElement
  | RefObject<HTMLElement | null>
  | Array<string | HTMLElement | RefObject<HTMLElement | null>>;

export interface SelectionDetails {
  text: string;
  range: Range;
  clientRect: DOMRect;
}

function resolveElements(target?: TargetSelector): HTMLElement[] | null {
  if (!target) return null;

  const items = Array.isArray(target) ? target : [target];
  const elements: HTMLElement[] = [];

  for (const item of items) {
    if (!item) continue;

    if (typeof item === "string") {
      const found = document.querySelectorAll<HTMLElement>(item);
      elements.push(...Array.from(found));
    } else if ("current" in item) {
      if (item.current instanceof HTMLElement) {
        elements.push(item.current);
      }
    } else if (item instanceof HTMLElement) {
      elements.push(item);
    }
  }

  return elements;
}

function isWithinTargets(targets: HTMLElement[], node: Node | null): boolean {
  if (!node) return false;
  return targets.some((target) => target.contains(node));
}

export function useGetSelectionDetails(target?: TargetSelector) {
  const [details, setDetails] = useState<SelectionDetails | null>(null);

  const evaluateSelection = useCallback(() => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setDetails(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();

    if (!text) {
      setDetails(null);
      return;
    }

    const targets = resolveElements(target);

    if (!targets) {
      setDetails({
        text,
        range,
        clientRect: range.getBoundingClientRect(),
      });
      return;
    }

    if (targets.length === 0) {
      setDetails(null);
      return;
    }

    const isStartInside = isWithinTargets(targets, range.startContainer);
    const isEndInside = isWithinTargets(targets, range.endContainer);

    if (isStartInside && isEndInside) {
      setDetails({
        text,
        range,
        clientRect: range.getBoundingClientRect(),
      });
    } else {
      setDetails(null);
    }
  }, [target]);

  useLayoutEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setDetails(null);
      }
    };

    const handleWindowChange = () => {
      evaluateSelection();
    };

    document.addEventListener("mouseup", evaluateSelection);
    document.addEventListener("keyup", evaluateSelection);
    document.addEventListener("contextmenu", evaluateSelection);
    document.addEventListener("selectionchange", handleSelectionChange);
    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("scroll", handleWindowChange, { capture: true });

    return () => {
      document.removeEventListener("mouseup", evaluateSelection);
      document.removeEventListener("keyup", evaluateSelection);
      document.removeEventListener("contextmenu", evaluateSelection);
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("scroll", handleWindowChange, {
        capture: true,
      });
    };
  }, [evaluateSelection]);

  return details;
}

export default useGetSelectionDetails;

export function insertTextAtCursor(
  text: string,
  target?: HTMLElement | null,
): void {
  if (!text) return;

  const activeEl = target ?? (document.activeElement as HTMLElement | null);
  if (!activeEl) return;

  if (typeof activeEl.focus === "function") {
    activeEl.focus();
  }

  if (
    activeEl instanceof HTMLInputElement ||
    activeEl instanceof HTMLTextAreaElement
  ) {
    const start = activeEl.selectionStart ?? activeEl.value.length;
    const end = activeEl.selectionEnd ?? activeEl.value.length;

    activeEl.setRangeText(text, start, end, "end");
    activeEl.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  if (
    activeEl.isContentEditable ||
    activeEl.getAttribute("contenteditable") === "true"
  ) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);

    activeEl.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
