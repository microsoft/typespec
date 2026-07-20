import {
  getTypeName,
  isArrayModelType,
  isTemplateInstance,
  type IndeterminateEntity,
  type TemplatedType,
  type Type,
  type Value,
} from "@typespec/compiler";
import { applyBaseNamePipeline } from "./naming.js";

function isNamedType(type: Type | Value | IndeterminateEntity): type is { name: string } & Type {
  return "name" in type && typeof type.name === "string";
}

function resolveArgName(arg: Type): string {
  if (arg.kind === "Model" && isArrayModelType(arg)) {
    const rawName = getTypeName(arg);
    return applyBaseNamePipeline(rawName);
  }
  if (isTemplateInstance(arg)) {
    return composeTemplateName(arg);
  }
  const rawName = getTypeName(arg);
  return applyBaseNamePipeline(rawName);
}

/**
 * Compose a name for a template instance by joining base name + "Of" + resolved arg names.
 * Each arg is resolved recursively (nested templates produce nested "Of" names).
 * Non-template types return their raw name unchanged.
 *
 * Examples:
 *   PaginatedModel<AdAccount> → "PaginatedModelOfAdAccount"
 *   Map<string, int32> → "MapOfStringAndInt"
 *   Wrapper<PaginatedModel<Board>> → "WrapperOfPaginatedModelOfBoard"
 */
export function composeTemplateName(type: TemplatedType): string {
  const name = type.name ?? "";

  if (!isTemplateInstance(type)) {
    return name;
  }

  const args = type.templateMapper.args.filter(isNamedType);

  if (args.length === 0) {
    return name;
  }

  const resolvedArgs = args.map((arg) => resolveArgName(arg as Type));
  const argString = resolvedArgs.join("And");

  return `${name}Of${argString}`;
}
