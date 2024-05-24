import { AreaPaths } from "./labels.js";

/**
 * Path that should trigger every CI build.
 */
const all = ["eng/common/", "vitest.config.ts"];

export const CIRules = {
  CSharp: [...AreaPaths["emitter:client:csharp"], ".editorconfig", ...all],
  Core: [
    "**/*",
    "!.prettierignore",
    "!.prettierrc.json",
    "!cspell.yaml",
    "!esling.config.json",
    ...ignore(AreaPaths["emitter:client:csharp"]),
  ],
};

function ignore(paths: string[]) {
  return paths.map((x) => `!${x}`);
}
