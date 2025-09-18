import { getSymNode } from "../core/binder.js";
import { compilerAssert } from "../core/diagnostics.js";
import { getDocData } from "../core/intrinsic-type-state.js";
import { Program } from "../core/program.js";
import { isType } from "../core/type-utils.js";
import { DocContent, Node, Sym, SyntaxKind, TemplateDeclarationNode, Type } from "../core/types.js";
import { getSymbolSignature } from "./type-signature.js";

interface GetSymbolDetailsOptions {
  includeSignature: boolean;
  includeParameterTags: boolean;
  /**
   * Whether to include the final expended definition of the symbol
   * For Model and Interface, it's body with expended members will be included. Otherwise, it will be the same as signature. (Support for other type may be added in the future as needed)
   * This is useful for models and interfaces with complex 'extends' and 'is' relationship when user wants to know the final expended definition.
   */
  includeExpandedDefinition?: boolean;
}

/**
 * Get the detailed documentation for a symbol.
 * @param program The program
 * @internal
 */
export async function getSymbolDetails(
  program: Program,
  symbol: Sym,
  options: GetSymbolDetailsOptions = {
    includeSignature: true,
    includeParameterTags: true,
    includeExpandedDefinition: false,
  },
): Promise<string> {
  const lines = [];
  if (options.includeSignature) {
    lines.push(await getSymbolSignature(program, symbol));
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
          `_@${tag.tagName.sv}_${"paramName" in tag ? ` \`${tag.paramName.sv}\`` : ""} —\n${getDocContent(tag.content)}`,
        );
      }
    }
  }
  if (options.includeExpandedDefinition) {
    lines.push(`*Full Definition:*`);
    lines.push(
      await getSymbolSignature(program, symbol, {
        includeBody: true,
      }),
    );
  }

  return lines.join("\n\n");
}

function getSymbolDocumentation(program: Program, symbol: Sym) {
  const docs: string[] = [];

  for (const node of [...symbol.declarations, ...(symbol.node ? [symbol.node] : [])]) {
    // Add /** ... */ developer docs
    for (const d of node.docs ?? []) {
      docs.push(getDocContent(d.content));
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
      docs.push(apiDocs.value);
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
