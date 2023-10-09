import {
  compilerAssert,
  DocContent,
  Node,
  Program,
  Sym,
  SyntaxKind,
  TemplateDeclarationNode,
  Type,
} from "../core/index.js";
import { getDocData } from "../lib/decorators.js";
import { getSymbolSignature } from "./type-signature.js";

/**
 * Get the detailed documentation for a symbol.
 * @param program The program
 * @internal
 */
export function getSymbolDetails(
  program: Program,
  symbol: Sym,
  options = {
    includeSignature: true,
    includeParameterTags: true,
  }
): string {
  const lines = [];
  if (options.includeSignature) {
    lines.push(getSymbolSignature(program, symbol));
  }
  const doc = getSymbolDocumentation(program, symbol);
  if (doc) {
    lines.push(doc);
  }
  for (const node of symbol.declarations) {
    for (const doc of node?.docs ?? []) {
      for (const tag of doc.tags) {
        if (
          !options.includeParameterTags &&
          (tag.kind === SyntaxKind.DocParamTag || tag.kind === SyntaxKind.DocTemplateTag)
        ) {
          continue;
        }
        lines.push(
          //prettier-ignore
          `_@${tag.tagName.sv}_${"paramName" in tag ? ` \`${tag.paramName.sv}\`` : ""} —\n${getDocContent(tag.content)}`
        );
      }
    }
  }
  return lines.join("\n\n");
}

function getSymbolDocumentation(program: Program, symbol: Sym) {
  const docs: string[] = [];

  for (const node of symbol.declarations) {
    // Add /** ... */ developer docs
    for (const d of node.docs ?? []) {
      docs.push(getDocContent(d.content));
    }
  }

  // Add @doc(...) API docs
  const type = symbol.type ?? program.checker.getTypeForNode(symbol.declarations[0]);
  const apiDocs = getDocData(program, type);
  // The doc comment is already included above we don't want to duplicate
  if (apiDocs && apiDocs.source === "comment") {
    docs.push(apiDocs.value);
  }

  return docs.join("\n\n");
}

/** @internal */
export function getParameterDocumentation(program: Program, type: Type): Map<string, string> {
  const map = new Map<string, string>();
  for (const d of type?.node?.docs ?? []) {
    for (const tag of d.tags) {
      if (tag.kind === SyntaxKind.DocParamTag) {
        map.set(tag.paramName.sv, getDocContent(tag.content));
      }
    }
  }
  return map;
}

/** @internal */
export function getTemplateParameterDocumentation(
  node: Node & TemplateDeclarationNode
): Map<string, string> {
  const map = new Map<string, string>();
  for (const d of node?.docs ?? []) {
    for (const tag of d.tags) {
      if (tag.kind === SyntaxKind.DocTemplateTag) {
        map.set(tag.paramName.sv, getDocContent(tag.content));
      }
    }
  }
  return map;
}

function getDocContent(content: readonly DocContent[]) {
  const docs = [];
  for (const node of content) {
    compilerAssert(
      node.kind === SyntaxKind.DocText,
      "No other doc content node kinds exist yet. Update this code appropriately when more are added."
    );
    docs.push(node.text);
  }
  return docs.join("");
}
