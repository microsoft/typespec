import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";
import { JsonSchemaTestLibrary } from "@typespec/json-schema/testing";
import { RestTestLibrary } from "@typespec/rest/testing";
import { VersioningTestLibrary } from "@typespec/versioning/testing";
import { CSharpServiceEmitterOptions } from "../src/lib/lib.js";
import { CSharpServiceEmitterTestLibrary } from "../src/lib/testing/index.js";

export async function createCSharpServiceEmitterTestHost() {
  const result = await createTestHost({
    libraries: [
      HttpTestLibrary,
      RestTestLibrary,
      VersioningTestLibrary,
      CSharpServiceEmitterTestLibrary,
      JsonSchemaTestLibrary,
    ],
  });

  return result;
}

export async function createCSharpServiceEmitterTestRunner(
  emitterOptions: CSharpServiceEmitterOptions = { "skip-format": true },
) {
  const host = await createCSharpServiceEmitterTestHost();

  const result = createTestWrapper(host, {
    autoUsings: ["TypeSpec.Http", "TypeSpec.Rest", "TypeSpec.Versioning", "TypeSpec.JsonSchema"],
    compilerOptions: {
      emit: ["@typespec/http-server-csharp"],
      options: {
        [CSharpServiceEmitterTestLibrary.name]: emitterOptions as any,
      },
      noEmit: false,
    },
  });

  return result;
}

export function getStandardService(code: string, ns?: string): string {
  return `
  @service(#{title: "${ns ?? "Microsoft.Contoso"}"})
    namespace ${ns ?? "Microsoft.Contoso"} {
      ${code}
    }`;
}
