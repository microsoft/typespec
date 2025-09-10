import OpenAPIParser from "@apidevtools/swagger-parser";
import { formatTypeSpec } from "@typespec/compiler";
import { OpenAPI3Document } from "../../../types.js";
import { generateMain } from "./generators/generate-main.js";
import { transform } from "./transforms/transforms.js";
import { createContext } from "./utils/context.js";

export interface ConvertOpenAPI3DocumentOptions {
  /**
   * Whether external $ref pointers will be resolved and included in the output.
   */
  disableExternalRefs?: boolean;
}

export async function convertOpenAPI3Document(
  document: OpenAPI3Document,
  { disableExternalRefs }: ConvertOpenAPI3DocumentOptions = {},
) {
  const parser = new OpenAPIParser();
  const bundleOptions = disableExternalRefs
    ? {
        resolve: { external: false, http: false, file: false },
      }
    : {};
  await parser.bundle(document as any, bundleOptions);
  const context = createContext(parser, document, console);
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
