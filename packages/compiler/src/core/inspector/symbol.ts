import pc from "picocolors";
import { Sym, SymbolFlags, SymbolLinks, SyntaxKind } from "../types.js";

/**
 * @internal
 */
export function inspectSymbol(sym: Sym, links: SymbolLinks = {}) {
  let output = `
${pc.blue(pc.inverse(` sym `))} ${pc.white(sym.name)}
${pc.dim("flags")} ${inspectSymbolFlags(sym.flags)}
  `.trim();

  if (sym.declarations && sym.declarations.length > 0) {
    const decls = sym.declarations.map((d) => SyntaxKind[d.kind]).join("\n");
    output += `\n${pc.dim("declarations")} ${decls}`;
  }

  if (sym.exports) {
    output += `\n${pc.dim("exports")} ${[...sym.exports.keys()].join(", ")}`;
  }

  if (sym.id) {
    output += `\n${pc.dim("id")} ${sym.id}`;
  }

  if (sym.members) {
    output += `\n${pc.dim("members")} ${[...sym.members.keys()].join(", ")}`;
  }

  if (sym.metatypeMembers) {
    output += `\n${pc.dim("metatypeMembers")} ${[...sym.metatypeMembers.keys()].join(", ")}`;
  }

  if (sym.parent) {
    output += `\n${pc.dim("parent")} ${sym.parent.name}`;
  }

  if (sym.symbolSource) {
    output += `\n${pc.dim("symbolSource")} ${sym.symbolSource.name}`;
  }

  if (sym.type) {
    output += `\n${pc.dim("type")} ${
      "name" in sym.type && sym.type.name ? String(sym.type.name) : sym.type.kind
    }`;
  }

  if (sym.value) {
    output += `\n${pc.dim("value")} present`;
  }

  if (Object.keys(links).length > 0) {
    output += `\nlinks\n`;

    if (links.declaredType) {
      output += `\n${pc.dim("declaredType")} ${
        "name" in links.declaredType && links.declaredType.name
          ? String(links.declaredType.name)
          : links.declaredType.kind
      }`;
    }

    if (links.instantiations) {
      output += `\n${pc.dim("instantiations")} initialized`;
    }

    if (links.type) {
      output += `\n${pc.dim("type")} ${
        "name" in links.type && links.type.name ? String(links.type.name) : links.type.kind
      }`;
    }
  }

  return output;
}

const flagsNames = [
  [SymbolFlags.Model, "Model"],
  [SymbolFlags.Scalar, "Scalar"],
  [SymbolFlags.Operation, "Operation"],
  [SymbolFlags.Enum, "Enum"],
  [SymbolFlags.Interface, "Interface"],
  [SymbolFlags.Union, "Union"],
  [SymbolFlags.Alias, "Alias"],
  [SymbolFlags.Namespace, "Namespace"],
  [SymbolFlags.Projection, "Projection"],
  [SymbolFlags.Decorator, "Decorator"],
  [SymbolFlags.TemplateParameter, "TemplateParameter"],
  [SymbolFlags.ProjectionParameter, "ProjectionParameter"],
  [SymbolFlags.Function, "Function"],
  [SymbolFlags.FunctionParameter, "FunctionParameter"],
  [SymbolFlags.Using, "Using"],
  [SymbolFlags.DuplicateUsing, "DuplicateUsing"],
  [SymbolFlags.SourceFile, "SourceFile"],
  [SymbolFlags.Member, "Member"],
  [SymbolFlags.Const, "Const"],
] as const;

export function inspectSymbolFlags(flags: SymbolFlags) {
  const names: string[] = [];
  for (const [flag, name] of flagsNames) {
    if (flags & flag) names.push(name);
  }
  return names.join(", ");
}
