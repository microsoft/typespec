import { TypeSpecProgram } from "../interfaces.js";
import { Context } from "../utils/context.js";
import { generateHelpers } from "../utils/generate-helpers.js";
import { generateDataType } from "./generate-model.js";
import { generateNamespace } from "./generate-namespace.js";
import { generateOperation } from "./generate-operation.js";
import { generateServiceInformation } from "./generate-service-info.js";

export function generateMain(program: TypeSpecProgram, context: Context): string {
  const sseImports = context.isSSEUsed()
    ? `  import "@typespec/streams";
  import "@typespec/sse";
  import "@typespec/events";`
    : "";

  const sseUsings = context.isSSEUsed() ? "\n  using SSE;" : "";

  return `
  import "@typespec/http";
  import "@typespec/openapi";
  import "@typespec/openapi3";${sseImports}

  using Http;
  using OpenAPI;${sseUsings}

  ${generateServiceInformation(program.serviceInfo, program.servers, program.tags, context.rootNamespace)}

  ${program.types.map((t) => generateDataType(t, context)).join("\n\n")}

  ${program.operations.map((o) => generateOperation(o, context)).join("\n\n")}

  ${Object.entries(program.namespaces)
    .map(([name, namespace]) => generateNamespace(name, namespace, context))
    .join("\n\n")}
  ${generateHelpers(context)}
  `;
}
