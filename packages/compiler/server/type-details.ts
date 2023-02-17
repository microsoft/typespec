import { compilerAssert, DocContent, Program, SyntaxKind, Type } from "../core/index.js";
import { getDoc } from "../lib/decorators.js";
import { getTypeSignature } from "./type-signature.js";

/**
 * Get the detailed documentation of a type.
 * @param program The program
 */
export function getTypeDetails(
  program: Program,
  type: Type,
  options = {
    includeSignature: true,
    includeParameterTags: true,
  }
): string {
  // BUG: https://github.com/microsoft/typespec/issues/1348
  // We've already resolved to a Type and lost the alias node so we don't show doc comments on aliases or alias signatures, currently.

  if (type.kind === "Intrinsic") {
    return "";
  }
  const lines = [];
  if (options.includeSignature) {
    lines.push(getTypeSignature(type));
  }
  const doc = getTypeDocumentation(program, type);
  if (doc) {
    lines.push(doc);
  }
  for (const doc of type?.node?.docs ?? []) {
    for (const tag of doc.tags) {
      if (tag.tagName.sv === "param" && !options.includeParameterTags) {
        continue;
      }
      lines.push(
        //prettier-ignore
        `_@${tag.tagName.sv}_${"paramName" in tag ? ` \`${tag.paramName.sv}\`` : ""} —\n${getDocContent(tag.content)}`
      );
    }
  }
  return lines.join("\n\n");
}

function getTypeDocumentation(program: Program, type: Type) {
  const docs: string[] = [];

  // Add /** ... */ developer docs
  for (const d of type?.node?.docs ?? []) {
    docs.push(getDocContent(d.content));
  }

  // Add @doc(...) API docs
  const apiDocs = getDoc(program, type);
  if (apiDocs) {
    docs.push(apiDocs);
  }

  return docs.join("\n\n");
}

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
