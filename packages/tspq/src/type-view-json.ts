import {
  getDoc,
  getLocationContext,
  getNamespaceFullName,
  getSourceLocation,
  getTypeName,
  type Enum,
  type Interface,
  type Model,
  type ModelProperty,
  type Namespace,
  type Operation,
  type Program,
  type Scalar,
  type Tuple,
  type Type,
  type Union,
} from "@typespec/compiler";
import { relative } from "path";

export interface TypeViewJsonOptions {
  /** How many levels deep to expand nested types. 0 = type references only, higher = more detail. Default 1. */
  depth?: number;
  /** Base directory for computing relative paths. Defaults to process.cwd(). */
  cwd?: string;
}

export interface TypeViewJsonNode {
  name: string;
  kind: string;
  namespace?: string;
  description?: string;
  location?: TypeViewLocation;
  details?: Record<string, unknown>;
}

export interface TypeViewLocation {
  path: string;
  line: number;
  column: number;
  context: string;
  synthetic?: boolean;
}

export function getTypeViewJson(
  program: Program,
  type: Type,
  options: TypeViewJsonOptions = {},
): TypeViewJsonNode {
  const { depth = 1, cwd = process.cwd() } = options;
  return buildTypeViewNode(program, type, depth, cwd);
}

function buildTypeViewNode(
  program: Program,
  type: Type,
  depth: number,
  cwd: string,
): TypeViewJsonNode {
  const node: TypeViewJsonNode = {
    name: getTypeName(type),
    kind: type.kind,
  };

  if ("namespace" in type && type.namespace) {
    node.namespace = getNamespaceFullName(type.namespace);
  }

  const doc = getDoc(program, type);
  if (doc) {
    node.description = doc;
  }

  node.location = getLocationInfo(program, type, cwd);

  if (depth > 0) {
    node.details = buildTypeDetails(program, type, depth, cwd);
  }

  return node;
}

function typeRef(program: Program, type: Type, depth: number, cwd: string): TypeViewJsonNode {
  return buildTypeViewNode(program, type, depth - 1, cwd);
}

function buildTypeDetails(
  program: Program,
  type: Type,
  depth: number,
  cwd: string,
): Record<string, unknown> {
  switch (type.kind) {
    case "Namespace":
      return buildNamespaceJson(program, type, depth, cwd);
    case "Model":
      return buildModelJson(program, type, depth, cwd);
    case "ModelProperty":
      return buildModelPropertyJson(program, type, depth, cwd);
    case "Interface":
      return buildInterfaceJson(program, type, depth, cwd);
    case "Operation":
      return buildOperationJson(program, type, depth, cwd);
    case "Enum":
      return buildEnumJson(type);
    case "Union":
      return buildUnionJson(program, type, depth, cwd);
    case "Scalar":
      return buildScalarJson(program, type, depth, cwd);
    case "Tuple":
      return buildTupleJson(program, type, depth, cwd);
    default:
      return {};
  }
}

function buildNamespaceJson(
  program: Program,
  type: Namespace,
  depth: number,
  cwd: string,
): Record<string, unknown> {
  return {
    namespaces: [...type.namespaces.values()].map((ns) => typeRef(program, ns, depth, cwd)),
    models: [...type.models.values()].map((m) => typeRef(program, m, depth, cwd)),
    scalars: [...type.scalars.values()].map((s) => typeRef(program, s, depth, cwd)),
    interfaces: [...type.interfaces.values()].map((i) => typeRef(program, i, depth, cwd)),
    operations: [...type.operations.values()].map((o) => typeRef(program, o, depth, cwd)),
    unions: [...type.unions.values()].map((u) => typeRef(program, u, depth, cwd)),
    enums: [...type.enums.values()].map((e) => typeRef(program, e, depth, cwd)),
  };
}

function buildModelJson(
  program: Program,
  type: Model,
  depth: number,
  cwd: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  result.baseModel = type.baseModel ? typeRef(program, type.baseModel, depth, cwd) : null;
  result.derivedModels = type.derivedModels.map((m) => typeRef(program, m, depth, cwd));
  if (type.indexer) {
    result.indexer = {
      key: typeRef(program, type.indexer.key, depth, cwd),
      value: typeRef(program, type.indexer.value, depth, cwd),
    };
  }
  result.properties = Object.fromEntries(
    [...type.properties.values()].map((prop) => [
      prop.name,
      {
        type: typeRef(program, prop.type, depth, cwd),
        optional: prop.optional,
      },
    ]),
  );
  return result;
}

function buildModelPropertyJson(
  program: Program,
  type: ModelProperty,
  depth: number,
  cwd: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  result.type = typeRef(program, type.type, depth, cwd);
  result.optional = type.optional;
  if (type.defaultValue !== undefined) {
    result.defaultValue = normalizeValue(type.defaultValue);
  }
  return result;
}

function buildInterfaceJson(
  program: Program,
  type: Interface,
  depth: number,
  cwd: string,
): Record<string, unknown> {
  return {
    operations: [...type.operations.values()].map((op) => typeRef(program, op, depth, cwd)),
    sourceInterfaces: type.sourceInterfaces.map((i) => typeRef(program, i, depth, cwd)),
  };
}

function buildOperationJson(
  program: Program,
  type: Operation,
  depth: number,
  cwd: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (type.interface) {
    result.interface = typeRef(program, type.interface, depth, cwd);
  }
  result.returnType = typeRef(program, type.returnType, depth, cwd);
  result.parameters = Object.fromEntries(
    [...type.parameters.properties.values()].map((prop) => [
      prop.name,
      {
        type: typeRef(program, prop.type, depth, cwd),
        optional: prop.optional,
      },
    ]),
  );
  return result;
}

function buildEnumJson(type: Enum): Record<string, unknown> {
  return {
    members: Object.fromEntries(
      [...type.members.values()].map((member) => [member.name, { value: member.value ?? null }]),
    ),
  };
}

function buildUnionJson(
  program: Program,
  type: Union,
  depth: number,
  cwd: string,
): Record<string, unknown> {
  return {
    variants: Object.fromEntries(
      [...type.variants.values()].map((variant) => [
        typeof variant.name === "symbol" ? variant.name.toString() : variant.name,
        { type: typeRef(program, variant.type, depth, cwd) },
      ]),
    ),
  };
}

function buildScalarJson(
  program: Program,
  type: Scalar,
  depth: number,
  cwd: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  result.baseScalar = type.baseScalar ? typeRef(program, type.baseScalar, depth, cwd) : null;
  result.derivedScalars = type.derivedScalars.map((s) => typeRef(program, s, depth, cwd));
  return result;
}

function buildTupleJson(
  program: Program,
  type: Tuple,
  depth: number,
  cwd: string,
): Record<string, unknown> {
  return {
    values: type.values.map((v) => typeRef(program, v, depth, cwd)),
  };
}

export function normalizeValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (isTypeSpecType(value)) {
    return { kind: value.kind, name: getTypeName(value) };
  }
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item, seen));
  }
  if (value instanceof Map) {
    return Object.fromEntries(
      [...value.entries()].map(([key, entry]) => [key.toString(), normalizeValue(entry, seen)]),
    );
  }
  if (value instanceof Set) {
    return [...value.values()].map((item) => normalizeValue(item, seen));
  }
  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      output[key] = normalizeValue(entry, seen);
    }
    return output;
  }
  return value;
}

function isTypeSpecType(value: unknown): value is Type {
  return (
    typeof value === "object" &&
    value !== null &&
    "entityKind" in value &&
    (value as { entityKind: string }).entityKind === "Type" &&
    "kind" in value
  );
}

export function getLocationInfo(program: Program, type: Type, cwd: string): TypeViewLocation {
  const location = getSourceLocation(type);
  const context = getLocationContext(program, type).type;
  if (location.isSynthetic || !location.file) {
    return { context, synthetic: true, path: "", line: 0, column: 0 };
  }
  const lineAndChar = location.file.getLineAndCharacterOfPosition(location.pos ?? 0);
  const line = lineAndChar.line + 1;
  const column = lineAndChar.character + 1;
  const cwdRelative = relative(cwd, location.file.path) || location.file.path;
  return { context, synthetic: false, path: cwdRelative, line, column };
}
