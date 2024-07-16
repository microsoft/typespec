import { TypeSpecProgram } from "../interfaces.js";
import { generateModel } from "./generate-model.js";
import { generateOperation } from "./generate-operation.js";
import { generateServiceInformation } from "./generate-service-info.js";

export function generateMain(program: TypeSpecProgram): string {
  return `
  import "@typespec/http";
  import "@typespec/openapi";
  import "@typespec/openapi3";

  using Http;
  using OpenAPI;

  ${generateServiceInformation(program.serviceInfo)}

  ${program.models.map(generateModel).join("\n\n")}

  ${program.operations.map(generateOperation).join("\n\n")}
  `;
}
