import { Namespace, Program, SymbolFlags, Type } from "@cadl-lang/compiler";
import { reportDiagnostic } from "./lib.js";

export function $onValidate(program: Program) {
  const root = program.checker!.getGlobalNamespaceType();

  validateNoExportAtRoot(program, root);
}

function validateNoExportAtRoot(program: Program, root: Namespace) {
  function validateFor(items: Map<string, Type & { name?: string }>) {
    for (const type of items.values()) {
      reportDiagnostic(program, {
        code: "missing-namespace",
        format: { type: type.kind, name: type.name ?? "" },
        target: type,
      });
    }
  }
  validateFor(root.models);
  validateFor(root.interfaces);
  validateFor(root.enums);
  validateFor(root.operations);
  validateFor(root.unions);

  for (const [name, sym] of root.node.symbol.exports?.entries() ?? []) {
    if (sym.flags & SymbolFlags.Decorator) {
      reportDiagnostic(program, {
        code: "missing-namespace",
        format: { type: "Decorator", name },
        target: sym,
      });
    } else if (sym.flags & SymbolFlags.Function) {
      reportDiagnostic(program, {
        code: "missing-namespace",
        format: { type: "Function", name },
        target: sym,
      });
    }
  }
}
