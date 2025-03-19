import { Program, Type } from "@typespec/compiler";
import { getExtensions } from "@typespec/openapi";

export function attachExtensions(program: Program, type: Type, emitObject: any) {
  // Attach any OpenAPI extensions
  const extensions = getExtensions(program, type);
  if (extensions) {
    for (const key of extensions.keys()) {
      emitObject[key] = extensions.get(key);
    }
  }
}
