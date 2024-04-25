import { isArray } from "../utils/misc.js";
import type {
  CodeFix,
  CodeFixContext,
  CodeFixEdit,
  CompilerHost,
  FilePos,
  InsertTextCodeFixEdit,
  ReplaceTextCodeFixEdit,
  SourceFile,
  SourceLocation,
} from "./types.js";

export async function resolveCodeFix(codeFix: CodeFix): Promise<CodeFixEdit[]> {
  const context = createCodeFixContext();
  const values = await codeFix.fix(context);
  const textEdit = values === undefined ? [] : isArray(values) ? values : [values];
  return textEdit;
}

export async function applyCodeFix(host: CompilerHost, codeFix: CodeFix) {
  const edits = await resolveCodeFix(codeFix);
  await applyCodeFixEdits(host, edits);
}

async function applyCodeFixEdits(host: CompilerHost, edits: CodeFixEdit[]) {
  const perFile = new Map<string, [SourceFile, CodeFixEdit[]]>();

  for (const edit of edits) {
    const file = edit.file;
    if (!perFile.has(file.path)) {
      perFile.set(file.path, [file, []]);
    }
    perFile.get(file.path)![1].push(edit);
  }

  for (const [file, edits] of perFile.values()) {
    const newContent = applyCodeFixEditsOnText(file.text, edits);
    await host.writeFile(file.path, newContent);
  }
}

function applyCodeFixEditsOnText(content: string, edits: CodeFixEdit[]): string {
  const segments = [];
  let last = 0;
  for (const edit of edits) {
    switch (edit.kind) {
      case "insert-text":
        segments.push(content.slice(last, edit.pos));
        segments.push(edit.text);
        last = edit.pos;
        break;
      case "replace-text":
        segments.push(content.slice(last, edit.pos));
        segments.push(edit.text);
        last = edit.end;
    }
  }
  segments.push(content.slice(last));
  return segments.join("");
}

function createCodeFixContext(): CodeFixContext {
  return {
    prependText,
    appendText,
    replaceText,
  };

  function prependText(node: SourceLocation | FilePos, text: string): InsertTextCodeFixEdit {
    return {
      kind: "insert-text",
      pos: node.pos,
      text,
      file: node.file,
    };
  }

  function appendText(node: SourceLocation | FilePos, text: string): InsertTextCodeFixEdit {
    return {
      kind: "insert-text",
      pos: "end" in node ? node.end : node.pos,
      text,
      file: node.file,
    };
  }

  function replaceText(node: SourceLocation, text: string): ReplaceTextCodeFixEdit {
    return {
      kind: "replace-text",
      pos: node.pos,
      end: node.end,
      file: node.file,
      text,
    };
  }
}
