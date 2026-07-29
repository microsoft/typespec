import { Diagnostic, resolvePath } from "@typespec/compiler";
import { createTester, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { MarkdownRenderer } from "../src/ref-doc/emitters/markdown.js";
import { extractRefDocs } from "../src/ref-doc/extractor.js";
import { TypeSpecRefDocBase } from "../src/ref-doc/types.js";

const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: [],
});

export async function extractTestRefDoc(
  code: string,
): Promise<[TypeSpecRefDocBase, readonly Diagnostic[]]> {
  const [{ program }] = await Tester.compileAndDiagnose(code);
  return extractRefDocs(program);
}

export async function createMarkdownRenderer(code: string) {
  const [refDoc, diagnostics] = await extractTestRefDoc(code);
  expectDiagnosticEmpty(diagnostics);
  return { renderer: new MarkdownRenderer(refDoc as any), refDoc };
}
