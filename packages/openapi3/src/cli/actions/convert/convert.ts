import { OpenAPI3Document } from "../../../types.js";
import { generateMain } from "./generators/generate-main.js";
import { transform } from "./transforms/transforms.js";

export async function convertOpenAPI3Document(document: OpenAPI3Document) {
  const program = transform(document);
  return await generateMain(program);
}
