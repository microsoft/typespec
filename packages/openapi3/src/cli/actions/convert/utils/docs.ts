export function generateDocs(doc: string | string[]): string {
  if (isEmptyDoc(doc)) {
    return ``;
  }

  const wrapped = lineWrap(doc);

  for (let i = 0; i < wrapped.length; i++) {
    if (wrapped[i].includes("@") || wrapped[i].includes("*/")) {
      if (wrapped.length === 1) {
        return `@doc("${wrapped[0].replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
      }
      return `@doc("""\n${wrapped.join("\n").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}\n""")`;
    }
  }

  return `/**\n* ${wrapped.join("\n* ")}\n*/`;
}

export function generateDocsContent(doc: string | string[]): string {
  if (isEmptyDoc(doc)) {
    return ``;
  }

  const wrapped = lineWrap(doc);
  return wrapped.length === 1 ? `${wrapped[0]}` : `""\n${wrapped.join("\n")}\n""`;
}

function lineWrap(doc: string | string[]): string[] {
  const maxLength = 80;

  let docString = Array.isArray(doc) ? doc.join("\n") : doc;
  docString = docString.replace(/\r\n/g, "\n");
  docString = docString.replace(/\r/g, "\n");

  if (docString.length <= maxLength && !docString.includes("\n")) {
    return [docString];
  }

  const oriLines = docString.split("\n");
  const lines: string[] = [];
  for (const oriLine of oriLines) {
    const words = oriLine.split(" ");
    let line = ``;
    for (const word of words) {
      if (word.length + 1 > maxLength - line.length) {
        lines.push(line.substring(0, line.length - 1));
        line = `${word} `;
      } else {
        line = `${line}${word} `;
      }
    }
    lines.push(`${line.substring(0, line.length - 1)}`);
  }

  return lines;
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
