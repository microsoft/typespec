import { stringLiteral } from "../generators/common.js";

export function generateDocs(doc: string): string {
  if (isEmptyDoc(doc)) {
    return ``;
  }

  if (doc.includes("*/")) {
    return `@doc(${stringLiteral(doc)})`;
  }
  const split = splitNewlines(doc.replaceAll("@", "\\@"));
  if (split.length === 1) {
    return `/** ${split[0]} */`;
  }
  return `/**\n* ${split.join("\n* ")}\n*/`;
}

function splitNewlines(doc: string | string[]): string[] {
  let docString = Array.isArray(doc) ? doc.join("\n") : doc;
  docString = docString.replace(/\r\n/g, "\n");
  docString = docString.replace(/\r/g, "\n");

  if (!docString.includes("\n")) {
    return [docString];
  }

  return docString.split("\n");
}

function isEmptyDoc(doc?: string | string[]): doc is undefined {
  if (!doc) {
    return true;
  }

  if (Array.isArray(doc) && !doc.length) {
    return true;
  }

  return false;
}
