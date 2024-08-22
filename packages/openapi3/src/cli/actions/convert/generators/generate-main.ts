import { TypeSpecProgram } from "../interfaces.js";
import { generateDataType } from "./generate-model.js";
import { generateNamespace } from "./generate-namespace.js";
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

  ${program.types.map(generateDataType).join("\n\n")}

  ${program.operations.map(generateOperation).join("\n\n")}

  ${Object.entries(program.namespaces)
    .map(([name, namespace]) => generateNamespace(name, namespace))
    .join("\n\n")}
  `;
}
