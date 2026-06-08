import { camelCase, constantCase, pascalCase, split, splitSeparateNumbers } from "change-case";

export interface NamingContext {
  isInput: boolean;
  isInterface: boolean;
}

type NameTransform = (name: string, context: NamingContext) => string;

function stripNamespace(name: string, _context: NamingContext): string {
  const parts = name.trim().split(".");
  return parts[parts.length - 1];
}

function sanitizeForGraphQL(name: string, _context: NamingContext): string {
  name = name.replaceAll("[]", "Array");
  name = name.replaceAll(/\W/g, "_");
  if (!/^[_a-zA-Z]/.test(name)) {
    name = `_${name}`;
  }
  return name;
}

function splitWithAcronyms(skipStart: boolean, name: string): string[] {
  const parts = split(name);
  if (name === name.toUpperCase()) {
    return parts;
  }
  return parts.flatMap((part, index) => {
    if (skipStart && index === 0) return part;
    if (part.match(/^[A-Z]+$/)) return part.split("");
    return part;
  });
}

function toPascalCase(name: string, _context: NamingContext): string {
  if (/^[A-Z]+$/.test(name)) {
    return name;
  }
  return pascalCase(name, {
    prefixCharacters: "_",
    split: splitWithAcronyms.bind(null, false),
  });
}

function toCamelCase(name: string, _context: NamingContext): string {
  return camelCase(name, {
    prefixCharacters: "_",
    split: splitWithAcronyms.bind(null, true),
  });
}

function toConstantCase(name: string, _context: NamingContext): string {
  return constantCase(name, {
    split: splitSeparateNumbers,
    prefixCharacters: "_",
  });
}

function applyInterfaceSuffix(name: string, context: NamingContext): string {
  if (!context.isInterface) return name;
  return name.endsWith("Interface") ? name : name + "Interface";
}

function applyInputSuffix(name: string, context: NamingContext): string {
  if (!context.isInput) return name;
  return name.endsWith("Input") ? name : name + "Input";
}

const baseNamePipeline: NameTransform[] = [stripNamespace, sanitizeForGraphQL, toPascalCase];

const typeNamePipeline: NameTransform[] = [
  ...baseNamePipeline,
  applyInterfaceSuffix,
  applyInputSuffix,
];

const fieldNamePipeline: NameTransform[] = [sanitizeForGraphQL, toCamelCase];

const enumMemberPipeline: NameTransform[] = [sanitizeForGraphQL, toConstantCase];

const noContext: NamingContext = { isInput: false, isInterface: false };

export function applyBaseNamePipeline(name: string): string {
  return baseNamePipeline.reduce((n, transform) => transform(n, noContext), name);
}

export function applyTypeNamePipeline(name: string, context: NamingContext): string {
  return typeNamePipeline.reduce((n, transform) => transform(n, context), name);
}

export function applyFieldNamePipeline(name: string): string {
  return fieldNamePipeline.reduce((n, transform) => transform(n, noContext), name);
}

export function applyEnumMemberPipeline(name: string): string {
  return enumMemberPipeline.reduce((n, transform) => transform(n, noContext), name);
}
