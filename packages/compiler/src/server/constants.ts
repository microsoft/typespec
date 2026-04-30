import { CompilerOptions } from "../core/options.js";

export const serverOptions: CompilerOptions = {
  dryRun: true,
  designTimeBuild: true,
  parseOptions: {
    comments: true,
    docs: true,
  },
};

export const Commands = {
  APPLY_CODE_FIX: "typespec.applyCodeFix",
};
