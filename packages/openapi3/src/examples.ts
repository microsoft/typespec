import { Value } from "@typespec/compiler";
import type { HttpProperty } from "@typespec/http";

export function getStatusCodeValue(value: Value, properties: HttpProperty[]): number | undefined {
  const statusCodeProperty = properties.find((p) => p.kind === "statusCode");
  if (statusCodeProperty === undefined) {
    return undefined;
  }

  const statusCode = getValueByPath(value, statusCodeProperty.path);
  if (statusCode?.valueKind === "NumericValue") {
    return statusCode.value.asNumber() ?? undefined;
  }
  return undefined;
}

export function getContentTypeValue(value: Value, properties: HttpProperty[]): string | undefined {
  const contentTypeProperty = properties.find((p) => p.kind === "contentType");
  if (contentTypeProperty === undefined) {
    return undefined;
  }

  const statusCode = getValueByPath(value, contentTypeProperty.path);
  if (statusCode?.valueKind === "StringValue") {
    return statusCode.value;
  }
  return undefined;
}

export function getBodyValue(value: Value, properties: HttpProperty[]): Value | undefined {
  const bodyProperty = properties.find((p) => p.kind === "body" || p.kind === "bodyRoot");
  if (bodyProperty !== undefined) {
    return getValueByPath(value, bodyProperty.path);
  }

  return value;
}

function getValueByPath(value: Value, path: (string | number)[]): Value | undefined {
  let current: Value | undefined = value;
  for (const key of path) {
    switch (current?.valueKind) {
      case "ObjectValue":
        current = current.properties.get(key.toString())?.value;
        break;
      case "ArrayValue":
        current = current.values[key as number];
        break;
      default:
        return undefined;
    }
  }
  return current;
}
