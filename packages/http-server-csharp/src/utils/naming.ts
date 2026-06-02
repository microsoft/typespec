import { camelCase, pascalCase } from "change-case";

/** C# reserved keywords that must be escaped in identifiers. */
const reservedWords: string[] = [
  "abstract",
  "as",
  "base",
  "bool",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "checked",
  "class",
  "const",
  "continue",
  "decimal",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "event",
  "explicit",
  "extern",
  "false",
  "finally",
  "fixed",
  "float",
  "for",
  "foreach",
  "goto",
  "if",
  "implicit",
  "in",
  "int",
  "interface",
  "internal",
  "is",
  "lock",
  "long",
  "namespace",
  "new",
  "null",
  "object",
  "operator",
  "out",
  "override",
  "params",
  "private",
  "protected",
  "public",
  "readonly",
  "ref",
  "return",
  "sbyte",
  "sealed",
  "short",
  "sizeof",
  "stackalloc",
  "static",
  "string",
  "struct",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "type",
  "typeof",
  "uint",
  "ulong",
  "unchecked",
  "unsafe",
  "ushort",
  "using",
  "virtual",
  "void",
  "volatile",
  "while",
];

/** C# contextual keywords that are reserved in certain contexts. */
const contextualWords: string[] = [
  "add",
  "allows",
  "alias",
  "and",
  "ascending",
  "args",
  "async",
  "await",
  "by",
  "descending",
  "dynamic",
  "equals",
  "field",
  "file",
  "from",
  "get",
  "global",
  "group",
  "init",
  "into",
  "join",
  "let",
  "managed",
  "nameof",
  "nint",
  "not",
  "notnull",
  "nuint",
  "on",
  "or",
  "orderby",
  "partial",
  "record",
  "remove",
  "required",
  "scoped",
  "select",
  "set",
  "unmanaged",
  "value",
  "var",
  "when",
  "where",
  "with",
  "yield",
];

const reservedMap: Map<string, string> = new Map<string, string>(
  [...reservedWords, ...contextualWords].map((w) => [w, `${pascalCase(w)}Name`]),
);

export enum NameCasingType {
  Class,
  Constant,
  Method,
  Namespace,
  Parameter,
  Property,
  Variable,
}

/**
 * Checks if a string is a valid C# identifier.
 * Optionally allows dots for namespace identifiers.
 */
export function isValidCSharpIdentifier(identifier: string, isNamespace: boolean = false): boolean {
  if (!isNamespace) return identifier?.match(/^[A-Za-z_][\w]*$/) !== null;
  return identifier?.match(/^[A-Za-z_][\w.]*$/) !== null;
}

/**
 * Replaces C# reserved words with safe alternatives (e.g., "class" → "ClassName").
 */
export function replaceCSharpReservedWord(identifier: string, context?: NameCasingType): string {
  const check = reservedMap.get(identifier.toLowerCase());
  if (check !== undefined) {
    return getCSharpIdentifier(check, context, false);
  }
  return identifier;
}

/**
 * Converts a name to a valid C# identifier with appropriate casing.
 */
export function getCSharpIdentifier(
  name: string,
  context: NameCasingType = NameCasingType.Class,
  checkReserved: boolean = true,
): string {
  if (name === undefined) return "Placeholder";
  if (checkReserved) {
    name = replaceCSharpReservedWord(name, context);
  }
  switch (context) {
    case NameCasingType.Namespace: {
      const parts: string[] = [];
      for (const part of name.split(".")) {
        parts.push(getCSharpIdentifier(part, NameCasingType.Class));
      }
      return parts.join(".");
    }
    case NameCasingType.Parameter:
    case NameCasingType.Variable:
      return camelCase(name);
    default:
      return pascalCase(name);
  }
}

/**
 * Replaces an invalid character at a given position with a safe alternative.
 */
export function getValidChar(target: string, position: number): string {
  if (position === 0) {
    if (target.match(/[A-Za-z_]/)) return target;
    return `Generated_${target.match(/\w/) ? target : ""}`;
  }
  if (!target.match(/[\w]/)) return "_";
  return target;
}

/**
 * Transforms an invalid identifier into a valid one by replacing bad characters.
 */
export function transformInvalidIdentifier(name: string): string {
  const chars: string[] = [];
  for (let i = 0; i < name.length; ++i) {
    chars.push(getValidChar(name.charAt(i), i));
  }
  return chars.join("");
}
