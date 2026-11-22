import {
  BLOCK_CLOSE_LINE,
  BLOCK_NAME,
  BLOCK_OPEN_LINE,
  COMMENT_CLOSE,
  COMMENT_OPEN,
  VARIABLE_NAME,
} from "@/constants/syntax.constants";
import type { BlockLayoutEntry, LayoutEntry, Part } from "@/types/editor.types";

type ExtractPartsParams = {
  template: string;
  variables: Record<string, string>;
  blockCounts: Record<string, number>;
};

type ExtractPartsResult = {
  newVariables: Record<string, string>;
  newParts: Part[];
  newLayout: LayoutEntry[];
  newBlockCounts: Record<string, number>;
  /** Mistakes in the template syntax, worded for the person writing it */
  issues: string[];
};

type ExtractPartsFunction = (params: ExtractPartsParams) => ExtractPartsResult;

type Token =
  | { kind: "text"; text: string }
  | { kind: "variable"; name: string }
  | { kind: "comment"; text: string }
  | { kind: "block"; name: string; body: Token[] };

const ESCAPED = `\\{\\{(?<escaped>${VARIABLE_NAME})\\}\\}`;
const VARIABLE = `\\{(?<variable>${VARIABLE_NAME})\\}`;
const COMMENT = `${COMMENT_OPEN}(?<comment>[\\s\\S]*?)${COMMENT_CLOSE}`;
// The open and the close marker each take a whole line, the body is whatever
// sits in between
const BLOCK =
  `^[ \\t]*#\\?[ \\t]*(?<blockName>${BLOCK_NAME})[ \\t]*\\r?\\n` +
  `(?<blockBody>[\\s\\S]*?)\\r?\\n?${BLOCK_CLOSE_LINE}`;

// Order matters: at the same position the first alternative wins, which is why
// {{Name}} is tried before {Name}. Blocks can't nest, so a block body is
// tokenized without the block alternative.
const ROOT_REGEX = new RegExp(
  [BLOCK, ESCAPED, VARIABLE, COMMENT].join("|"),
  "gmu",
);
const BODY_REGEX = new RegExp([ESCAPED, VARIABLE, COMMENT].join("|"), "gmu");

const normalizeName = (name: string) => name.replace(/\s+/g, " ").trim();

/** Splits a template into text, variables, comments and repeated blocks. */
const tokenize = (template: string, withBlocks: boolean): Token[] => {
  const regex = withBlocks ? ROOT_REGEX : BODY_REGEX;
  regex.lastIndex = 0;

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

    const { blockName, blockBody, escaped, variable, comment } =
      match.groups ?? {};

    if (blockName !== undefined) {
      tokens.push({
        kind: "block",
        name: normalizeName(blockName),
        body: tokenize(blockBody ?? "", false),
      });
    } else if (escaped !== undefined) {
      // {{Name}} is the way to write the literal text {Name}
      tokens.push({ kind: "text", text: `{${normalizeName(escaped)}}` });
    } else if (variable !== undefined) {
      tokens.push({ kind: "variable", name: normalizeName(variable) });
    } else if (comment !== undefined) {
      tokens.push({ kind: "comment", text: comment.trim() });
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

/**
 * What is left of the source once everything that was understood is taken
 * out: text stays, every other token becomes a placeholder. Line markers that
 * show up here were not part of any block or comment, so they are mistakes.
 */
const leftover = (tokens: Token[]) =>
  tokens
    .map((token) => (token.kind === "text" ? token.text : "\u0000"))
    .join("");

const findIssues = (tokens: Token[]): string[] => {
  const issues = new Set<string>();

  const rootLeftover = leftover(tokens);

  for (const match of rootLeftover.matchAll(
    new RegExp(BLOCK_OPEN_LINE, "gm"),
  )) {
    issues.add(
      `Block "${normalizeName(match[1])}" is never closed, put ?# on its own line after it.`,
    );
  }

  if (new RegExp(BLOCK_CLOSE_LINE, "m").test(rootLeftover)) {
    issues.add("Found a ?# line without a #? line opening its block.");
  }

  const leftovers = [rootLeftover];

  tokens.forEach((token) => {
    if (token.kind !== "block") return;

    const bodyLeftover = leftover(token.body);
    leftovers.push(bodyLeftover);

    for (const match of bodyLeftover.matchAll(
      new RegExp(BLOCK_OPEN_LINE, "gm"),
    )) {
      issues.add(
        `Block "${normalizeName(match[1])}" sits inside block "${token.name}", blocks can't be nested.`,
      );
    }
  });

  if (leftovers.some((text) => new RegExp(COMMENT_OPEN).test(text))) {
    issues.add(
      `A comment is opened but never closed, end it with ${COMMENT_CLOSE}`,
    );
  }

  return [...issues];
};

export const extractParts: ExtractPartsFunction = ({
  template,
  variables,
  blockCounts,
}) => {
  const tokens = tokenize(template, true);
  const issues = findIssues(tokens);

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
      text: newVariables[key] === "" ? `{${key}}` : newVariables[key],
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

  // A variable written outside a block as "Name 1" would share its input with
  // the first copy of a block variable called "Name"
  blockEntries.forEach((entry) => {
    outsideNames.forEach((outside) => {
      const base = outside.match(/^(.+) \d+$/)?.[1];

      if (base && entry.names.includes(base)) {
        issues.push(
          `Variable "${outside}" clashes with the numbered copies of "${base}" in block "${entry.name}", rename one of them.`,
        );
      }
    });
  });

  return { newVariables, newParts, newLayout, newBlockCounts, issues };
};
