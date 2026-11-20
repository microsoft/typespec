import { dereference } from "@scalar/openapi-parser";
import type { AnyObject } from "@scalar/types/utils";
import { formatTypeSpec } from "@typespec/compiler";
import type { SupportedOpenAPIDocuments } from "../../../types.js";
import { generateMain } from "./generators/generate-main.js";
import { transform } from "./transforms/transforms.js";
import { createContext } from "./utils/context.js";

/** Controls reference handling and the service namespace when converting an OpenAPI document to TypeSpec source. */
export interface ConvertOpenAPI3DocumentOptions {
  /**
   * Reject external `$ref` pointers instead of resolving them. Document-local
   * references remain allowed. Defaults to false.
   */
  disableExternalRefs?: boolean;
  /**
   * The namespace name to use instead of generating from the OpenAPI title.
   */
  namespace?: string;
}

/**
 * Converts a supported OpenAPI document to TypeSpec source text without writing files.
 * References are dereferenced before transformation; external references can be
 * rejected through `disableExternalRefs`.
 *
 * @returns Generated source, formatted when possible, or the unformatted source if formatting fails.
 * @throws If dereferencing fails, including when a disabled external reference is encountered.
 */
export async function convertOpenAPI3Document(
  document: SupportedOpenAPIDocuments,
  { disableExternalRefs, namespace }: ConvertOpenAPI3DocumentOptions = {},
) {
  const conversionDocument = hoistInlineBodyExampleSchemas(document);
  const dereferenceOptions = disableExternalRefs
    ? {
        onDereference: (data: { schema: AnyObject; ref: string }): void => {
          if (data.ref.startsWith("#")) {
            return;
          }
          throw new Error(`External $ref pointers are disabled, but found $ref: ${data.ref}`);
        },
      }
    : {};
  const { specification } = await dereference(
    conversionDocument as unknown as AnyObject,
    dereferenceOptions,
  );
  if (!specification) {
    throw new Error("Failed to dereference OpenAPI document");
  }
  const context = createContext(conversionDocument, console, namespace);
  const program = transform(context);
  const content = generateMain(program, context);
  try {
    return await formatTypeSpec(content, {
      printWidth: 100,
      tabWidth: 2,
    });
  } catch {
    return content;
  }
}

function hoistInlineBodyExampleSchemas(
  document: SupportedOpenAPIDocuments,
): SupportedOpenAPIDocuments {
  const converted = structuredClone(document) as SupportedOpenAPIDocuments;
  const mutableDocument = converted as any;
  const components = (mutableDocument.components ??= {});
  const schemas = (components.schemas ??= {});
  let nextSchemaIndex = 0;

  function hoistContentSchemas(content: Record<string, any> | undefined): void {
    for (const mediaType of Object.values(content ?? {})) {
      const schema = mediaType?.schema;
      if (
        !schema ||
        typeof schema !== "object" ||
        "$ref" in schema ||
        !("examples" in schema) ||
        (Array.isArray(schema.examples) && schema.examples.length === 0)
      ) {
        continue;
      }

      let name: string;
      do {
        name = `__OpenAPIExampleBody${nextSchemaIndex++}`;
      } while (name in schemas);

      schemas[name] = schema;
      mediaType.schema = { $ref: `#/components/schemas/${name}` };
    }
  }

  function hoistRequestBody(requestBody: any): void {
    if (requestBody && typeof requestBody === "object" && !("$ref" in requestBody)) {
      hoistContentSchemas(requestBody.content);
    }
  }

  function hoistResponses(responses: any): void {
    if (!responses || typeof responses !== "object" || "$ref" in responses) {
      return;
    }

    for (const response of Object.values(responses)) {
      if (response && typeof response === "object" && !("$ref" in response)) {
        hoistContentSchemas((response as any).content);
      }
    }
  }

  for (const requestBody of Object.values(components.requestBodies ?? {})) {
    hoistRequestBody(requestBody);
  }
  for (const response of Object.values(components.responses ?? {})) {
    if (response && typeof response === "object" && !("$ref" in response)) {
      hoistContentSchemas((response as any).content);
    }
  }

  function hoistOperation(operation: any): void {
    if (!operation || typeof operation !== "object") {
      return;
    }

    if ("requestBody" in operation || "responses" in operation) {
      hoistRequestBody(operation.requestBody);
      hoistResponses(operation.responses);
    }
  }

  function visitPathItem(pathItem: any): void {
    if (!pathItem || typeof pathItem !== "object") {
      return;
    }

    hoistOperation(pathItem.query);
    for (const operation of Object.values(pathItem.additionalOperations ?? {})) {
      hoistOperation(operation);
    }
    for (const [key, operation] of Object.entries(pathItem)) {
      if (key !== "query" && key !== "additionalOperations") {
        hoistOperation(operation);
      }
    }
  }

  for (const pathItem of Object.values(mutableDocument.paths ?? {})) {
    visitPathItem(pathItem);
  }

  return converted;
}
