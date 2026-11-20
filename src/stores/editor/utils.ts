import type { BlockLayoutEntry, LayoutEntry, Part } from "@/types/editor.types";

type ExtractPartsParams = {
  template: string;
  variables: Record<string, string>;
  blockCounts: Record<string, number>;
  regexLabel: string;
  regexValue: RegExp;
};

type ExtractPartsResult = {
  newVariables: Record<string, string>;
  newParts: Part[];
  newLayout: LayoutEntry[];
  newBlockCounts: Record<string, number>;
};

type ExtractPartsFunction = (params: ExtractPartsParams) => ExtractPartsResult;

type Token =
  | { kind: "text"; text: string }
  | { kind: "variable"; name: string }
  | { kind: "comment"; text: string }
  | { kind: "block"; name: string; body: Token[] };

// #? Name
// ...body...
// ?#
const BLOCK_SOURCE =
  "#\\?[ \\t]*([^\\s#][^\\r\\n]*?)[ \\t]*\\r?\\n([\\s\\S]*?)\\r?\\n?[ \\t]*\\?#";
const COMMENT_SOURCE = "#!([\\s\\S]*?)!#";

/**
 * Splits a template into text, variables, comments and (optionally) repeated
 * blocks. Every alternative has exactly one capture group, except the block
 * which has two (name and body).
 */
const tokenize = (
  template: string,
  variableSource: string,
  withBlocks: boolean,
): Token[] => {
  const alternatives = [
    ...(withBlocks ? [`(?:${BLOCK_SOURCE})`] : []),
    `(?:${variableSource})`,
    `(?:${COMMENT_SOURCE})`,
  ];
  const regex = new RegExp(alternatives.join("|"), "g");
  const offset = withBlocks ? 2 : 0;

  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        kind: "text",
        text: template.slice(lastIndex, match.index),
      });
    }

    if (withBlocks && match[1] !== undefined) {
      tokens.push({
        kind: "block",
        name: match[1].trim(),
        body: tokenize(match[2] ?? "", variableSource, false),
      });
    } else if (match[offset + 1] !== undefined) {
      tokens.push({ kind: "variable", name: match[offset + 1] });
    } else if (match[offset + 2] !== undefined) {
      tokens.push({ kind: "comment", text: match[offset + 2].trim() });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < template.length) {
    tokens.push({ kind: "text", text: template.slice(lastIndex) });
  }

  return tokens;
};

const uniqueVariableNames = (tokens: Token[]): string[] => {
  const names: string[] = [];
  tokens.forEach((token) => {
    if (token.kind === "variable" && !names.includes(token.name)) {
      names.push(token.name);
    }
  });
  return names;
};

export const extractParts: ExtractPartsFunction = ({
  template,
  variables,
  blockCounts,
  regexLabel,
  regexValue,
}) => {
  const tokens = tokenize(template, regexValue.source, true);

  // Variables used outside of every block stay shared, so a block never
  // renames them, whatever the number of repetitions
  const outsideNames = new Set(uniqueVariableNames(tokens));

  const newVariables: Record<string, string> = {};
  const newParts: Part[] = [];
  const newLayout: LayoutEntry[] = [];
  const newBlockCounts: Record<string, number> = {};

  const seenVariables = new Set<string>();
  const blockEntries = new Map<string, BlockLayoutEntry>();

  const pushVariable = (key: string) => {
    newVariables[key] = variables[key] || "";
    newParts.push({
      type: "variable",
      text:
        newVariables[key] === ""
          ? regexLabel.replace("variable", key)
          : newVariables[key],
    });
  };

  tokens.forEach((token) => {
    if (token.kind === "text") {
      newParts.push({ type: "text", text: token.text });
    } else if (token.kind === "comment") {
      newParts.push({ type: "comment", text: token.text });
    } else if (token.kind === "variable") {
      pushVariable(token.name);

      if (!seenVariables.has(token.name)) {
        seenVariables.add(token.name);
        newLayout.push({ type: "variable", name: token.name });
      }
    } else {
      // Variables that only exist inside this block, these get numbered
      const scopedNames = uniqueVariableNames(token.body).filter(
        (name) => !outsideNames.has(name),
      );

      // A block without variables of its own has nothing to repeat
      const count =
        scopedNames.length > 0 ? Math.max(1, blockCounts[token.name] ?? 1) : 1;

      if (scopedNames.length > 0) {
        newBlockCounts[token.name] = count;
      }

      // The label is a comment, so it is left out when copying. It carries
      // the line break so the copied text stays clean
      newParts.push({
        type: "comment",
        text: `Repeated Block: ${token.name}\n`,
      });

      let entry = blockEntries.get(token.name);

      if (!entry && scopedNames.length > 0) {
        entry = {
          type: "block",
          name: token.name,
          count,
          names: [],
          keys: [],
        };
        blockEntries.set(token.name, entry);
        newLayout.push(entry);
      }

      scopedNames.forEach((name) => {
        if (entry && !entry.names.includes(name)) {
          entry.names.push(name);
        }
      });

      for (let instance = 0; instance < count; instance++) {
        if (instance > 0) {
          newParts.push({ type: "text", text: "\n" });
        }

        token.body.forEach((bodyToken) => {
          if (bodyToken.kind === "text") {
            newParts.push({ type: "text", text: bodyToken.text });
          } else if (bodyToken.kind === "comment") {
            newParts.push({ type: "comment", text: bodyToken.text });
          } else if (bodyToken.kind === "variable") {
            const isShared = outsideNames.has(bodyToken.name);
            // Always numbered, even with a single instance, so adding a
            // repetition never renames the existing variables
            const key = isShared
              ? bodyToken.name
              : `${bodyToken.name} ${instance + 1}`;

            pushVariable(key);

            if (!isShared && entry && !entry.keys.includes(key)) {
              entry.keys.push(key);
            }
          }
        });
      }
    }
  });

  return { newVariables, newParts, newLayout, newBlockCounts };
};
