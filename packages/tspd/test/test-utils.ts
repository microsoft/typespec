import { createTestHost, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { MarkdownRenderer } from "../src/ref-doc/emitters/markdown.js";
import { extractRefDocs } from "../src/ref-doc/extractor.js";

export async function extractTestRefDoc(code: string) {
  const host = await createTestHost();
  host.addTypeSpecFile("main.tsp", code);
  await host.compile("main.tsp");
  return extractRefDocs(host.program);
}

export async function createMarkdownRenderer(code: string) {
  const [refDoc, diagnostics] = await extractTestRefDoc(code);
  expectDiagnosticEmpty(diagnostics);
  return { renderer: new MarkdownRenderer(refDoc as any), refDoc };
}
