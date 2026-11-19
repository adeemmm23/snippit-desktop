export type Part = {
  type: "variable" | "text" | "comment";
  text: string;
};

/** A plain variable that lives outside of any repeated block. */
export type VariableLayoutEntry = {
  type: "variable";
  name: string;
};

/** A repeated block, with the variable keys of every instance in order. */
export type BlockLayoutEntry = {
  type: "block";
  name: string;
  /** How many times the block is currently repeated (always >= 1). */
  count: number;
  /** Base names of the variables that belong to this block. */
  names: string[];
  /** Variable keys of every instance, instance by instance. */
  keys: string[];
};

export type LayoutEntry = VariableLayoutEntry | BlockLayoutEntry;
