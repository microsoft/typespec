import { Context } from "./context.js";
import { supportedHttpMethods } from "./supported-http-methods.js";

export function generateHelpers(context: Context): string {
  const helpers: string[] = [];

  if (usesDefaultResponse(context)) {
    helpers.push(DEFAULT_RESPONSE_TEMPLATE);
  }

  if (helpers.length) {
    return `namespace GeneratedHelpers {\n${helpers.join("\n")}\n}`;
  }

  return "";
}

const DEFAULT_RESPONSE_TEMPLATE = `
@doc(Description)
@error
model DefaultResponse<Description extends valueof string = "", Body = void, Headers extends {} = {}> {
  @body body: Body;
  ...Headers;
}
`.trim();

function usesDefaultResponse(context: Context): boolean {
  const doc = context.openApi3Doc;
  // Check #/components/responses for status codes
  for (const [statusCode] of Object.keys(doc.components?.responses ?? {})) {
    if (statusCode === "default") return true;
  }

  // Check #/paths/{path}/{method}/responses for status codes
  for (const pathItem of Object.values(doc.paths)) {
    for (const method of supportedHttpMethods) {
      const operation = pathItem[method];
      if (!operation) continue;
      for (const statusCode of Object.keys(operation.responses ?? {})) {
        if (statusCode === "default") return true;
      }
    }
  }

  return false;
}
