import { formatTypeSpec } from "@typespec/compiler";
import { OpenAPI3Document } from "../../../types.js";
import { generateMain } from "./generators/generate-main.js";
import { transform } from "./transforms/transforms.js";

export async function convertOpenAPI3Document(document: OpenAPI3Document) {
  const program = transform(document);
  const content = generateMain(program);
  try {
    return await formatTypeSpec(content, {
      printWidth: 100,
      tabWidth: 2,
    });
  } catch {
    return content;
  }
}
