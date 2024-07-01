import { formatTypeSpec } from "@typespec/compiler";
import { generateModel } from "../generators/generate-model.js";
import { generateOperation } from "../generators/generate-operation.js";
import { generateServiceInformation } from "../generators/generate-service-info.js";
import { TypeSpecProgram } from "../interfaces.js";

export async function emitMain(program: TypeSpecProgram): Promise<string> {
  const content = `
  import "@typespec/http";
  import "@typespec/openapi";
  import "@typespec/openapi3";

  using Http;
  using OpenAPI;

  ${generateServiceInformation(program.serviceInfo)}

  ${program.models.map(generateModel).join("\n\n")}

  ${program.operations.map(generateOperation).join("\n\n")}
  `;

  return formatTypeSpec(content, {
    printWidth: 100,
    tabWidth: 2,
  });
}
