export function generateDocs(doc: string | string[]): string {
  if (isEmptyDoc(doc)) {
    return ``;
  }

  const split = splitNewlines(doc);

  for (let i = 0; i < split.length; i++) {
    if (split[i].includes("@") || split[i].includes("*/")) {
      if (split.length === 1) {
        return `@doc("${split[0].replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
      }
      return `@doc("""\n${split.join("\n").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}\n""")`;
    }
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
