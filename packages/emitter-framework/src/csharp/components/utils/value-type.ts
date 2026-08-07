import type { Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";

/**
 * TypeSpec std scalars whose C# representation is a value type (struct) rather than a
 * reference type. Anything not listed here — notably `string`, `bytes` and `url` — maps to
 * a C# reference type.
 */
const valueTypeScalarNames: ReadonlySet<string> = new Set([
  "numeric",
  "integer",
  "float",
  "int8",
  "int16",
  "int32",
  "int64",
  "uint8",
  "uint16",
  "uint32",
  "uint64",
  "safeint",
  "float32",
  "float64",
  "decimal",
  "decimal128",
  "boolean",
  "plainDate",
  "plainTime",
  "utcDateTime",
  "offsetDateTime",
  "duration",
  "unixTimestamp32",
]);

/**
 * Returns true when the TypeSpec type is emitted as a C# value type (struct).
 *
 * This is what decides whether an optional value needs an explicit `?` suffix: reference
 * types are already nullable under `#nullable enable`, value types are not.
 */
export function isCSharpValueType($: Typekit, type: Type): boolean {
  switch (type.kind) {
    case "Boolean":
    case "Number":
      return true;
    case "String":
    case "StringTemplate":
      return false;
    case "Enum":
      return true;
    case "EnumMember":
      return true;
    case "Union":
      // A union that maps onto a C# enum is a value type; any other union degrades to
      // `object`, which is not.
      return Boolean(type.name) && $.union.isValidEnum(type);
    case "ModelProperty":
      return isCSharpValueType($, type.type);
    case "Scalar":
      return valueTypeScalarNames.has($.scalar.getStdBase(type)?.name ?? type.name);
    default:
      return false;
  }
}
