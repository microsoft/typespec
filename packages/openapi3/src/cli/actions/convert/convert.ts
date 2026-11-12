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
  const { specification } = await dereference(document as unknown as AnyObject, dereferenceOptions);
  if (!specification) {
    throw new Error("Failed to dereference OpenAPI document");
  }
  const context = createContext(document, console, namespace);
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
