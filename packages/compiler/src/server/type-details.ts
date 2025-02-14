import { getSymNode } from "../core/binder.js";
import {
  compilerAssert,
  DocContent,
  getDocData,
  isType,
  Node,
  Program,
  Sym,
  SyntaxKind,
  TemplateDeclarationNode,
  Type,
} from "../core/index.js";
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
  },
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

        const descMsg = getDocContent(tag.content);
        if (descMsg.startsWith("```")) {
          lines.push(
            //prettier-ignore
            fence(`@${tag.tagName.sv}${"paramName" in tag ? `${tag.paramName.sv}` : ""} —`)+`\n${descMsg}`,
          );
        } else {
          lines.push(
            //prettier-ignore
            fence(`@${tag.tagName.sv}${"paramName" in tag ? ` ${tag.paramName.sv}` : ""} — ${descMsg}`),
          );
        }
      }
    }
  }
  return lines.join("\n\n");
}

function getSymbolDocumentation(program: Program, symbol: Sym) {
  const docs: string[] = [];

  for (const node of [...symbol.declarations, ...(symbol.node ? [symbol.node] : [])]) {
    // Add /** ... */ developer docs
    for (const d of node.docs ?? []) {
      docs.push(fence(getDocContent(d.content)));
    }
  }

  // Add @doc(...) API docs
  let type = symbol.type;
  if (!type) {
    const entity = program.checker.getTypeOrValueForNode(getSymNode(symbol));
    if (entity && isType(entity)) {
      type = entity;
    }
  }
  if (type) {
    const apiDocs = getDocData(program, type);
    // The doc comment is already included above we don't want to duplicate. Only include if it was specificed via `@doc`
    if (apiDocs && apiDocs.source === "decorator") {
      docs.push(fence(apiDocs.value));
    }
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
  node: Node & TemplateDeclarationNode,
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
      "No other doc content node kinds exist yet. Update this code appropriately when more are added.",
    );
    docs.push(node.text);
  }
  return docs.join("");
}

function fence(content: string) {
  return content.startsWith("```") ? content : `\`\`\`\n${content}\n\`\`\``;
}
