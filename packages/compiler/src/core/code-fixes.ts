import type {
  CodeFix,
  CodeFixContext,
  CodeFixEdit,
  PrependTextCodeFixEdit,
  ReplaceTextCodeFixEdit,
  SourceLocation,
} from "./types.js";
import { isArray } from "./util.js";

export async function resolveCodeFix(codeFix: CodeFix): Promise<CodeFixEdit[]> {
  const context = createCodeFixContext();
  const values = await codeFix.fix(context);
  const textEdit = values === undefined ? [] : isArray(values) ? values : [values];
  return textEdit;
}

function createCodeFixContext(): CodeFixContext {
  return {
    prependText,
    replaceText,
  };

  function prependText(node: SourceLocation, text: string): PrependTextCodeFixEdit {
    return {
      kind: "prepend-text",
      pos: node.pos,
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
