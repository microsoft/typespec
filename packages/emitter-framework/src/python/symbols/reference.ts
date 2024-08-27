import { Refkey, resolve, useContext } from "@alloy-js/core";
import { SourceFileContext } from "../index.js";
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

  // return memo(() => {
  //   if (resolveResult.value === undefined) {
  //     return "<Unresolved Symbol>";
  //   }

  //   const { targetDeclaration, pathDown } = resolveResult.value;

  //   validateSymbolReachable(pathDown);

  //   // Where the target declaration is relative to the referencing scope.
  //   // * package: target symbol is in a different package
  //   // * module: target symbol is in a different module
  //   // * local: target symbol is within the current module
  //   const targetLocation = pathDown[0]?.kind ?? "local";

  //   if (targetLocation === "package") {
  //     // need package import
  //     const pkg = usePackage();
  //     const sourcePackage = pathDown[0] as PythonPackageScope;

  //     const symbolPath = [
  //       ...(pathDown.slice(2) as PythonMemberScope[]).map((s) => s.owner),
  //       targetDeclaration,
  //     ];

  //     const importSymbol = symbolPath[0];

  //     let localSymbol;
  //     // find public dependency
  //     for (const [publicPath, module] of sourcePackage.exportedSymbols) {
  //       if (module.exportedSymbols.has(importSymbol.refkey)) {
  //         localSymbol = untrack(() => sourceFile!.scope.addImport(importSymbol, module));
  //       }
  //     }

  //     if (!localSymbol) {
  //       throw new Error("The symbol " + targetDeclaration.name + " is not exported from package");
  //     }

  //     symbolPath[0] = localSymbol;
  //     return buildMemberExpression(symbolPath);
  //   } else if (targetLocation === "module") {
  //     const symbolPath = [
  //       ...(pathDown.slice(1) as PythonMemberScope[]).map((s) => s.owner),
  //       targetDeclaration,
  //     ];

  //     const importSymbol = symbolPath[0];

  //     return buildMemberExpression(symbolPath);
  //   }

  //   // local reference
  //   const syms = (pathDown as PythonMemberScope[]).map((s) => s.owner);
  //   syms.push(targetDeclaration);
  //   return buildMemberExpression(syms);
  // });
}

function buildMemberExpression(symbolPath: PythonOutputSymbol[]) {
  return symbolPath.map((sym) => sym.name).join(".");
}

function validateSymbolReachable(path: PythonOutputScope[]) {
  // TODO: Reimplement if necessary
  // for (const scope of path) {
  //   if (scope.kind === "function") {
  //     throw new Error("Cannot reference a symbol inside a function from outside a function");
  //   }
  // }
}
