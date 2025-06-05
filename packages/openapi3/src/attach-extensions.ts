import { Program, Type } from "@typespec/compiler";
import { getExtensions } from "@typespec/openapi";
import { set as setAtPath } from "es-toolkit/compat";

export function attachExtensions(program: Program, type: Type, emitObject: any) {
  // Attach any OpenAPI extensions
  const extensions = getExtensions(program, type);
  if (extensions) {
    for (const record of extensions) {
      // emitObject[key] = extensions.get(key);
      setAtPath(emitObject, record.key, record.value);
    }
  }
}
