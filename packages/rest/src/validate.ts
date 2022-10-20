import { Program } from "@cadl-lang/compiler";
import { getLinter } from "@cadl-lang/lint";
import { getAllHttpServices } from "./http/operations.js";
import { restLib } from "./lib.js";
import { duplicateParentKey } from "./rules/duplicate-parent-key.js";

const linter = getLinter(restLib);
linter.registerRules([duplicateParentKey], {
  enable: true,
});

export function $onValidate(program: Program) {
  // Run the linter
  linter.lintOnValidate(program);

  // Pass along any diagnostics that might be returned from the HTTP library
  const [, diagnostics] = getAllHttpServices(program);
  if (diagnostics.length > 0) {
    program.reportDiagnostics(diagnostics);
  }
}
