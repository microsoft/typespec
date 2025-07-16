import { getEncode, ModelProperty, Program } from "@typespec/compiler";

export function getParameterStyle(
  program: Program,
  type: ModelProperty,
): "pipeDelimited" | "spaceDelimited" | undefined {
  const encode = getEncode(program, type);
  if (!encode) return;

  if (encode.encoding === "ArrayEncoding.pipeDelimited") {
    return "pipeDelimited";
  } else if (encode.encoding === "ArrayEncoding.spaceDelimited") {
    return "spaceDelimited";
  }
  return;
}
