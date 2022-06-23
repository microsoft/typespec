import { Program } from "@cadl-lang/compiler";
import { getAllRoutes } from "./http/route.js";

export function $onValidate(program: Program) {
  const [, diagnostics] = getAllRoutes(program);
  if (diagnostics.length > 0) {
    program.reportDiagnostics(diagnostics);
  }
}
