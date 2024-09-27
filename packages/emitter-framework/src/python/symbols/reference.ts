import { memo, Refkey, resolve, useContext } from "@alloy-js/core";
import { PythonMemberScope, PythonPackageScope, SourceFileContext, usePackage } from "../index.js";
import { PythonOutputSymbol } from "./output-symbol.js";
import { PythonOutputScope } from "./scopes.js";

/**
 * Resolve reference to symbol reference, and handle dependency management
 *
 * @param refkey Reference key to symbol
 */
export function ref(refkey: Refkey) {
  const sourceFile = useContext(SourceFileContext);
  const resolveResult = resolve<PythonOutputScope, PythonOutputSymbol>(refkey as Refkey);

  return memo(() => {
    if (resolveResult.value === undefined) {
      return `<Unresolved Symbol>`;
    }

    const { targetDeclaration, pathDown } = resolveResult.value;

    // Where the target declaration is relative to the referencing scope.
    // * package: target symbol is in a different package
    // * module: target symbol is in a different module
    // * local: target symbol is within the current module
    const targetLocation: string = pathDown[0]?.kind ?? "local";
    if (targetLocation === "local") {
      // local reference
      const syms = (pathDown as PythonMemberScope[]).map((s) => s.owner);
      syms.push(targetDeclaration);
      const memberExpression = buildMemberExpression(syms);
      return memberExpression;
    }
  });
}

function buildMemberExpression(symbolPath: PythonOutputSymbol[]) {
  return symbolPath.map((sym) => sym.name).join(".");
}
