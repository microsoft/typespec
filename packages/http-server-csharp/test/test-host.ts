import { resolvePath } from "@typespec/compiler";
import { createTester, TesterInstance } from "@typespec/compiler/testing";
import { CSharpServiceEmitterOptions } from "../src/lib/lib.js";

const libraryName = "@typespec/http-server-csharp";

export const ApiTester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: [
    "@typespec/http",
    "@typespec/rest",
    "@typespec/versioning",
    "@typespec/json-schema",
    libraryName,
  ],
})
  .importLibraries()
  .using("Http")
  .using("Rest")
  .using("Versioning")
  .using("JsonSchema");

export const EmitterTester = ApiTester.emit(libraryName);

export async function compileAndDiagnose(
  tester: TesterInstance,
  code: string,
  emitterOptions: CSharpServiceEmitterOptions = { "skip-format": true },
) {
  return await tester.compileAndDiagnose(code, {
    compilerOptions: {
      emit: [libraryName],
      options: {
        [libraryName]: emitterOptions as any,
      },
    },
  });
}

export function getStandardService(code: string, ns?: string): string {
  return `
  @service(#{title: "${ns ?? "Microsoft.Contoso"}"})
    namespace ${ns ?? "Microsoft.Contoso"} {
      ${code}
    }`;
}
