import { Namespace, Program, Sym, SymbolFlags, SyntaxKind, Type } from "@typespec/compiler";
import { reportDiagnostic } from "./lib.js";

export function $onValidate(program: Program) {
  const root = program.checker!.getGlobalNamespaceType();

  validateNoExportAtRoot(program, root);
  validateDecoratorSignature(program);
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

const excludeDecoratorSignature = new Set(["@docFromComment", "@indexer", "@test"]);
function validateDecoratorSignature(program: Program) {
  function navigate(sym: Sym) {
    if (sym.flags & SymbolFlags.Decorator) {
      const hasSignature = sym.declarations.some(
        (x) => x.kind === SyntaxKind.DecoratorDeclarationStatement,
      );
      if (!hasSignature && !excludeDecoratorSignature.has(sym.name)) {
        reportDiagnostic(program, {
          code: "missing-signature",
          format: { decName: sym.name.slice(1) },
          target: sym,
        });
      }
    }
    for (const exp of sym.exports?.values() ?? []) {
      navigate(exp);
    }
  }
  for (const jsFile of program.jsSourceFiles.values()) {
    navigate(jsFile.symbol);
  }
}
