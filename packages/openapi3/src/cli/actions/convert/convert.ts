import OpenAPIParser from "@readme/openapi-parser";
import { formatTypeSpec } from "@typespec/compiler";
import { OpenAPI3Document } from "../../../types.js";
import { generateMain } from "./generators/generate-main.js";
import { transform } from "./transforms/transforms.js";
import { createContext } from "./utils/context.js";

export async function convertOpenAPI3Document(document: OpenAPI3Document) {
  const parser = new OpenAPIParser();
  await parser.bundle(document as any, { resolve: { external: false, http: false, file: false } });
  const context = createContext(parser, document);
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
