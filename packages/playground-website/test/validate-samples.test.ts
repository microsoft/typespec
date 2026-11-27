import {
  NodeHost,
  compile,
  getDirectoryPath,
  resolveCompilerOptions,
  resolvePath,
} from "@typespec/compiler";
import { expectDiagnosticEmpty, findTestPackageRoot } from "@typespec/compiler/testing";
import { it } from "vitest";
import { TypeSpecPlaygroundConfig } from "../src/config.js";

const samples = TypeSpecPlaygroundConfig.samples;
const packageRoot = await findTestPackageRoot(import.meta.url);
for (const [name, sample] of Object.entries(samples)) {
  it(`compile ${name}`, async () => {
    const entrypoint = resolvePath(packageRoot, sample.filename);
    const [options, diagnostics] = await resolveCompilerOptions(NodeHost, {
      cwd: getDirectoryPath(entrypoint),
      entrypoint,
    });
    expectDiagnosticEmpty(diagnostics);
    const program = await compile(NodeHost, entrypoint, {
      ...options,
      ...(sample.compilerOptions ?? {}),
      noEmit: true,
      emit: sample.preferredEmitter ? [sample.preferredEmitter] : [],
    });
    expectDiagnosticEmpty(program.diagnostics);
  });
}
