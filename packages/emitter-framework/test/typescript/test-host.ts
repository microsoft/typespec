import { Program } from "@typespec/compiler";
import {
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
} from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";

export async function createTypespecCliTestHost(
  options: { libraries: "Http"[] } = { libraries: [] }
) {
  const libraries = [];
  if (options.libraries.includes("Http")) {
    libraries.push(HttpTestLibrary);
  }
  return createTestHost({
    libraries,
  });
}

export async function createEmitterFrameworkTestRunner(options: { autoUsings?: string[] } = {}) {
  const host = await createTypespecCliTestHost();
  return createTestWrapper(host, {
    autoUsings: options.autoUsings,
  });
}

export async function getProgram(
  code: string,
  options: { libraries: "Http"[] } = { libraries: [] }
): Promise<Program> {
  const host = await createTypespecCliTestHost(options);
  const wrapper = createTestWrapper(host, {
    compilerOptions: {
      noEmit: true,
    },
  });
  const [_, diagnostics] = await wrapper.compileAndDiagnose(code);
  expectDiagnosticEmpty(diagnostics);
  return wrapper.program;
}
