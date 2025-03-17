import { Namespace, Program, Type } from "@typespec/compiler";
import { SyntaxKind } from "@typespec/compiler/ast";
import { reportDiagnostic } from "./lib.js";

export function $onValidate(program: Program) {
  const root = program.getGlobalNamespaceType();

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

  for (const [name, dec] of root.decoratorDeclarations) {
    reportDiagnostic(program, {
      code: "missing-namespace",
      format: { type: "Decorator", name: `@${name}` },
      target: dec,
    });
  }
}

const excludeDecoratorSignature = new Set(["@docFromComment", "@indexer", "@test"]);
function validateDecoratorSignature(program: Program) {
  function navigate(sym: any) {
    // SymbolFlags.Decorator = 1 << 9
    if (sym.flags & (1 << 9)) {
      const hasSignature = sym.declarations.some(
        (x: any) => x.kind === SyntaxKind.DecoratorDeclarationStatement,
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
    navigate((jsFile as any).symbol);
  }
}
