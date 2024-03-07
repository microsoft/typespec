const variablePrefix = `--tsp-tgv`;
export const ColorsVariables = {
  background: `${variablePrefix}-background`,
  dataKey: `${variablePrefix}-data-key`,
  indentationGuide: `${variablePrefix}-indentation-guide`,
  literal: `${variablePrefix}-literal`,
  property: `${variablePrefix}-property`,
  ref: `${variablePrefix}-ref`,
  typeKind: `${variablePrefix}-type-kind`,
  typeName: `${variablePrefix}-type-name`,
} as const;

export type ColorVariable = keyof typeof ColorsVariables;
export type ColorPalette = Record<ColorVariable, string>;
export const DefaultColors: ColorPalette = {
  background: "#f3f3f3",
  dataKey: "#333333",
  indentationGuide: "#777",
  literal: "#5da713",
  property: "#9c5d27",
  ref: "#268bd2",
  typeKind: "#7a3e9d",
  typeName: "#333333",
};

export const Colors: typeof ColorsVariables = Object.fromEntries(
  Object.entries(ColorsVariables).map(([k, v]) => [k, `var(${v}, ${(DefaultColors as any)[k]})`])
) as any;
