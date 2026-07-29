import { getEncode, ModelProperty, Program } from "@typespec/compiler";

export function getParameterStyle(
  program: Program,
  type: ModelProperty,
): "pipeDelimited" | "spaceDelimited" | "commaDelimited" | "newlineDelimited" | undefined {
  const encode = getEncode(program, type);
  if (!encode) return;

  if (encode.encoding === "ArrayEncoding.pipeDelimited") {
    return "pipeDelimited";
  } else if (encode.encoding === "ArrayEncoding.spaceDelimited") {
    return "spaceDelimited";
  } else if (encode.encoding === "ArrayEncoding.commaDelimited") {
    return "commaDelimited";
  } else if (encode.encoding === "ArrayEncoding.newlineDelimited") {
    return "newlineDelimited";
  }
  return;
}
