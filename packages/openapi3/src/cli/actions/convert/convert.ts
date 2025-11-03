import { AnyObject, dereference } from "@scalar/openapi-parser";
import { formatTypeSpec } from "@typespec/compiler";
import { SupportedOpenAPIDocuments } from "../../../types.js";
import { generateMain } from "./generators/generate-main.js";
import { transform } from "./transforms/transforms.js";
import { createContext } from "./utils/context.js";

export interface ConvertOpenAPI3DocumentOptions {
  /**
   * Whether external $ref pointers will be resolved and included in the output.
   */
  disableExternalRefs?: boolean;
  /**
   * The namespace name to use instead of generating from the OpenAPI title.
   */
  namespace?: string;
}

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
  const { specification } = await dereference(document, dereferenceOptions);
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
