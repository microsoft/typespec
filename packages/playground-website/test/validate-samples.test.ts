import { NodeHost, compile, resolvePath } from "@typespec/compiler";
import { expectDiagnosticEmpty, findTestPackageRoot } from "@typespec/compiler/testing";
import { it } from "vitest";
import { TypeSpecPlaygroundConfig } from "../src/index.js";

const samples = TypeSpecPlaygroundConfig.samples;
const packageRoot = await findTestPackageRoot(import.meta.url);
for (const [name, sample] of Object.entries(samples)) {
  it(`compile ${name}`, async () => {
    const program = await compile(NodeHost, resolvePath(packageRoot, sample.filename), {
      noEmit: true,
      emit: [sample.preferredEmitter],
    });
    expectDiagnosticEmpty(program.diagnostics);
  });
}
