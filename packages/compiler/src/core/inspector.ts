import pc from "picocolors";
import { Node, Sym, SymbolFlags, SymbolLinks, SyntaxKind } from "./types.js";

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

export function inspectSymbolFlags(symbolFlags: SymbolFlags) {
  if (symbolFlags === SymbolFlags.None) {
    return "None";
  }
  const flags = [];

  symbolFlags & SymbolFlags.Alias && flags.push("Alias");
  symbolFlags & SymbolFlags.Declaration && flags.push("Declaration");
  symbolFlags & SymbolFlags.Decorator && flags.push("Decorator");
  symbolFlags & SymbolFlags.DuplicateUsing && flags.push("DuplicateUsing");
  symbolFlags & SymbolFlags.Enum && flags.push("Enum");
  symbolFlags & SymbolFlags.ExportContainer && flags.push("ExportContainer");
  symbolFlags & SymbolFlags.Function && flags.push("Function");
  symbolFlags & SymbolFlags.FunctionParameter && flags.push("FunctionParameter");
  symbolFlags & SymbolFlags.Implementation && flags.push("Implementation");
  symbolFlags & SymbolFlags.Interface && flags.push("Interface");
  symbolFlags & SymbolFlags.LateBound && flags.push("LateBound");
  symbolFlags & SymbolFlags.Member && flags.push("Member");
  symbolFlags & SymbolFlags.MemberContainer && flags.push("MemberContainer");
  symbolFlags & SymbolFlags.Model && flags.push("Model");
  symbolFlags & SymbolFlags.Namespace && flags.push("Namespace");
  symbolFlags & SymbolFlags.Operation && flags.push("Operation");
  symbolFlags & SymbolFlags.Projection && flags.push("Projection");
  symbolFlags & SymbolFlags.ProjectionParameter && flags.push("ProjectionParameter");
  symbolFlags & SymbolFlags.Scalar && flags.push("Scalar");
  symbolFlags & SymbolFlags.SourceFile && flags.push("SourceFile");
  symbolFlags & SymbolFlags.TemplateParameter && flags.push("TemplateParameter");
  symbolFlags & SymbolFlags.Union && flags.push("Union");
  symbolFlags & SymbolFlags.Using && flags.push("Using");

  return flags.join(" ");
}

export function inspectSyntaxNode(node: Node) {
  let output = `
    ${pc.blue(pc.inverse(` node `))} ${pc.white(SyntaxKind[node.kind])}
  `.trim();

  //output += JSON.stringify(node);
  return output;
}
