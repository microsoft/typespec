import { defineTypeInfoProvider } from "@typespec/compiler";
import { getHttpOperation } from "./operations.js";
import type { HttpStatusCodeRange } from "./types.js";

/**
 * Contribute HTTP specific information about types to IDEs (e.g. hover) and tooling.
 *
 * For an operation, this surfaces the resolved HTTP route (verb + URI template) plus basic
 * response status codes so it can be shown on hover or queried programmatically. This provider
 * never mutates the type graph.
 */
export const $provideTypeInfo = defineTypeInfoProvider(({ program, target }) => {
  if (target.kind !== "Operation") {
    return undefined;
  }
  const [operation] = getHttpOperation(program, target);
  if (!operation) {
    return undefined;
  }

  const lines = [`\`HTTP Route\`: \`${operation.verb.toUpperCase()} ${operation.uriTemplate}\``];

  const statusCodes = operation.responses.map((response) => formatStatusCode(response.statusCodes));
  if (statusCodes.length > 0) {
    lines.push(`\`Responses\`: ${statusCodes.map((code) => `\`${code}\``).join(", ")}`);
  }

  return { content: lines.join("\n\n") };
});

function formatStatusCode(statusCode: HttpStatusCodeRange | number | "*"): string {
  if (statusCode === "*") {
    return "*";
  }
  if (typeof statusCode === "number") {
    return String(statusCode);
  }
  return `${statusCode.start}-${statusCode.end}`;
}
