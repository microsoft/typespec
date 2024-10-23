import { NodeHost, compile, resolvePath } from "@typespec/compiler";
import { expectDiagnosticEmpty, findTestPackageRoot } from "@typespec/compiler/testing";
import { it } from "vitest";
import { TypeSpecPlaygroundConfig } from "../src/config.js";

const samples = TypeSpecPlaygroundConfig.samples;
const packageRoot = await findTestPackageRoot(import.meta.url);
for (const [name, sample] of Object.entries(samples)) {
  it(`compile ${name}`, async () => {
    const program = await compile(NodeHost, resolvePath(packageRoot, sample.filename), {
      ...(sample.compilerOptions ?? {}),
      noEmit: true,
      emit: sample.preferredEmitter ? [sample.preferredEmitter] : [],
    });
    expectDiagnosticEmpty(program.diagnostics);
  });
}
