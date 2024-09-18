import {
  IntrinsicScalarName,
  IntrinsicType,
  Model,
  ModelProperty,
  NoTarget,
  Program,
  Scalar,
  Type,
  getFriendlyName,
  isNumericType,
  isTemplateInstance,
} from "@typespec/compiler";
import { StringBuilder } from "@typespec/compiler/emitter-framework";
import {
  HttpOperation,
  HttpOperationResponse,
  HttpStatusCodesEntry,
  MetadataInfo,
  Visibility,
  createMetadataInfo,
  isBody,
  isBodyRoot,
  isMetadata,
  isStatusCode,
} from "@typespec/http";
import { camelCase, pascalCase } from "change-case";
import { getAttributes } from "./attributes.js";
import {
  Attribute,
  BooleanValue,
  CSharpType,
  CSharpValue,
  NameCasingType,
  NullValue,
  NumericValue,
  StringValue,
} from "./interfaces.js";
import { reportDiagnostic } from "./lib.js";

export function getCSharpTypeForScalar(program: Program, scalar: Scalar): CSharpType {
  if (program.checker.isStdType(scalar)) {
    return getCSharpTypeForStdScalars(program, scalar);
  }
  if (scalar.baseScalar) {
    return getCSharpTypeForScalar(program, scalar.baseScalar);
  }

  reportDiagnostic(program, {
    code: "unrecognized-scalar",
    format: { typeName: scalar.name },
    target: scalar,
  });
  return new CSharpType({
    name: "Object",
    namespace: "System",
    isBuiltIn: true,
    isValueType: false,
  });
}

export const UnknownType: CSharpType = new CSharpType({
  name: "JsonNode",
  namespace: "System.Text.Json",
  isValueType: false,
  isBuiltIn: true,
});
export function getCSharpType(
  program: Program,
  type: Type,
  namespace: string,
): { type: CSharpType; value?: CSharpValue } | undefined {
  const known = getKnownType(program, type);
  if (known !== undefined) return { type: known };
  switch (type.kind) {
    case "Boolean":
      return { type: standardScalars.get("boolean")!, value: new BooleanValue(type.value) };
    case "Number":
      return { type: standardScalars.get("numeric")!, value: new NumericValue(type.value) };
    case "String":
      return { type: standardScalars.get("string")!, value: new StringValue(type.value) };
    case "EnumMember":
      const enumValue = type.value === undefined ? type.name : type.value;
      if (typeof enumValue === "string")
        return { type: standardScalars.get("string")!, value: new StringValue(enumValue) };
      else return { type: standardScalars.get("numeric")!, value: new NumericValue(enumValue) };
    case "Intrinsic":
      return getCSharpTypeForIntrinsic(program, type);
    case "Object":
      return { type: UnknownType };
    case "ModelProperty":
      return getCSharpType(program, type.type, namespace);
    case "Scalar":
      return { type: getCSharpTypeForScalar(program, type) };
    case "Tuple":
      const resolvedItem = coalesceTypes(program, type.values, namespace);
      const itemType = resolvedItem.type;
      return {
        type: new CSharpType({
          name: `${itemType.name}[]`,
          namespace: itemType.namespace,
          isBuiltIn: itemType.isBuiltIn,
          isValueType: false,
        }),
      };
    case "UnionVariant":
      return getCSharpType(program, type.type, namespace);
    case "Union":
      return coalesceTypes(
        program,
        [...type.variants.values()].map((v) => v.type),
        namespace,
      );
    case "Interface":
      return {
        type: new CSharpType({
          name: ensureCSharpIdentifier(program, type, type.name, NameCasingType.Class),
          namespace: namespace,
          isBuiltIn: false,
          isValueType: false,
        }),
      };
    case "Enum":
      return {
        type: new CSharpType({
          name: ensureCSharpIdentifier(program, type, type.name, NameCasingType.Class),
          namespace: `${namespace}.Models`,
          isBuiltIn: false,
          isValueType: false,
        }),
      };
    case "Model":
      if (type.indexer !== undefined && isNumericType(program, type.indexer?.key)) {
        const resolvedItem = getCSharpType(program, type.indexer.value, namespace);
        if (resolvedItem === undefined) return undefined;
        const { type: itemType, value: _ } = resolvedItem;

        return {
          type: new CSharpType({
            name: `${itemType.name}[]`,
            namespace: itemType.namespace,
            isBuiltIn: itemType.isBuiltIn,
            isValueType: false,
          }),
        };
      }
      let name: string = type.name;
      if (isTemplateInstance(type)) {
        name = getFriendlyName(program, type)!;
      }
      return {
        type: new CSharpType({
          name: ensureCSharpIdentifier(program, type, name, NameCasingType.Class),
          namespace: `${namespace}.Models`,
          isBuiltIn: false,
          isValueType: false,
        }),
      };
    default:
      return undefined;
  }
}

export function coalesceTypes(
  program: Program,
  types: Type[],
  namespace: string,
): { type: CSharpType; value?: CSharpValue } {
  const visited = new Map<Type, { type: CSharpType; value?: CSharpValue }>();
  let candidateType: CSharpType | undefined = undefined;
  let candidateValue: CSharpValue | undefined = undefined;
  for (const type of types) {
    if (!visited.has(type)) {
      const resolvedType = getCSharpType(program, type, namespace);
      if (resolvedType === undefined) return { type: UnknownType };
      if (resolvedType.type === UnknownType) return resolvedType;
      if (candidateType === undefined) {
        candidateType = resolvedType.type;
        candidateValue = resolvedType.value;
      } else {
        if (candidateValue !== resolvedType.value) candidateValue = undefined;
        if (candidateType !== resolvedType.type) return { type: UnknownType };
      }
      visited.set(type, resolvedType);
    }
  }

  return { type: candidateType !== undefined ? candidateType : UnknownType, value: candidateValue };
}

export function getKnownType(program: Program, type: Type): CSharpType | undefined {
  return undefined;
}

export function getCSharpTypeForIntrinsic(
  program: Program,
  type: IntrinsicType,
): { type: CSharpType; value?: CSharpValue } | undefined {
  switch (type.name) {
    case "unknown":
      return { type: UnknownType };
    case "void":
      return {
        type: new CSharpType({
          name: "void",
          namespace: "System",
          isBuiltIn: true,
          isValueType: false,
        }),
      };
    case "null":
      return {
        type: new CSharpType({
          name: "object",
          namespace: "System",
          isBuiltIn: true,
          isValueType: false,
        }),
        value: new NullValue(),
      };
    default:
      return undefined;
  }
}

type ExtendedIntrinsicScalarName = IntrinsicScalarName | "unixTimestamp32";
const standardScalars: Map<ExtendedIntrinsicScalarName, CSharpType> = new Map<
  ExtendedIntrinsicScalarName,
  CSharpType
>([
  [
    "bytes",
    new CSharpType({ name: "byte[]", namespace: "System", isBuiltIn: true, isValueType: false }),
  ],
  [
    "int8",
    new CSharpType({ name: "SByte", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "uint8",
    new CSharpType({ name: "Byte", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "int16",
    new CSharpType({ name: "Int16", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "uint16",
    new CSharpType({ name: "UInt16", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "int16",
    new CSharpType({ name: "Int16", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "uint16",
    new CSharpType({ name: "UInt16", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "int32",
    new CSharpType({ name: "int", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "uint32",
    new CSharpType({ name: "UInt32", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "integer",
    new CSharpType({ name: "long", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "int64",
    new CSharpType({ name: "long", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "uint64",
    new CSharpType({ name: "UInt64", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "safeint",
    new CSharpType({ name: "long", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "float",
    new CSharpType({ name: "double", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "float64",
    new CSharpType({ name: "double", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "float32",
    new CSharpType({ name: "float", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "string",
    new CSharpType({ name: "string", namespace: "System", isBuiltIn: true, isValueType: false }),
  ],
  [
    "boolean",
    new CSharpType({ name: "bool", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "plainDate",
    new CSharpType({ name: "DateTime", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "utcDateTime",
    new CSharpType({
      name: "DateTimeOffset",
      namespace: "System",
      isBuiltIn: true,
      isValueType: true,
    }),
  ],
  [
    "offsetDateTime",
    new CSharpType({
      name: "DateTimeOffset",
      namespace: "System",
      isBuiltIn: true,
      isValueType: true,
    }),
  ],
  [
    "unixTimestamp32",
    new CSharpType({
      name: "DateTimeOffset",
      namespace: "System",
      isBuiltIn: true,
      isValueType: true,
    }),
  ],
  [
    "plainTime",
    new CSharpType({ name: "DateTime", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "duration",
    new CSharpType({ name: "TimeSpan", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "numeric",
    new CSharpType({ name: "object", namespace: "System", isBuiltIn: true, isValueType: false }),
  ],
  [
    "url",
    new CSharpType({ name: "string", namespace: "System", isBuiltIn: true, isValueType: false }),
  ],
  [
    "decimal",
    new CSharpType({ name: "decimal", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
  [
    "decimal128",
    new CSharpType({ name: "decimal", namespace: "System", isBuiltIn: true, isValueType: true }),
  ],
]);
export function getCSharpTypeForStdScalars(
  program: Program,
  scalar: Scalar & { name: ExtendedIntrinsicScalarName },
): CSharpType {
  const builtIn: CSharpType | undefined = standardScalars.get(scalar.name);
  if (builtIn !== undefined) {
    if (scalar.name === "numeric" || scalar.name === "integer" || scalar.name === "float") {
      reportDiagnostic(program, {
        code: "no-numeric",
        format: { sourceType: scalar.name, targetType: builtIn?.getTypeReference() },
        target: scalar,
      });
    }
    return builtIn;
  }

  reportDiagnostic(program, {
    code: "unrecognized-scalar",
    format: { typeName: scalar.name },
    target: scalar,
  });
  return new CSharpType({
    name: "Object",
    namespace: "System",
    isBuiltIn: true,
    isValueType: false,
  });
}

export function isValueType(program: Program, type: Type): boolean {
  if (type.kind === "Boolean" || type.kind === "Number" || type.kind === "Enum") return true;
  if (type.kind !== "Scalar") return false;
  const scalarType = getCSharpTypeForScalar(program, type);
  return scalarType.isValueType;
}

export function formatComment(
  text: string,
  lineLength: number = 76,
  lineEnd: string = "\n",
): string {
  function getNextLine(target: string): string {
    for (let i = lineLength - 1; i > 0; i--) {
      if ([" ", ".", "?", ",", ";"].includes(target.charAt(i))) {
        return `/// ${text.substring(0, i).replaceAll("\n", " ")}`;
      }
    }

    return `/// ${text.substring(0, lineLength)}`;
  }
  let remaining: string = text;
  const lines: string[] = [];
  while (remaining.length > lineLength) {
    const currentLine = getNextLine(remaining);
    remaining =
      remaining.length > currentLine.length ? remaining.substring(currentLine.length + 1) : "";
    lines.push(currentLine);
  }

  if (remaining.length > 0) lines.push(`/// ${remaining}`);
  return `///<summary>${lineEnd}${lines.join(lineEnd)}${lineEnd}///</summary>`;
}

export function getCSharpIdentifier(
  name: string,
  context: NameCasingType = NameCasingType.Class,
): string {
  if (name === undefined) return "Placeholder";
  switch (context) {
    case NameCasingType.Namespace:
      const parts: string[] = [];
      for (const part of name.split(".")) {
        parts.push(getCSharpIdentifier(part, NameCasingType.Class));
      }
      return parts.join(".");
    case NameCasingType.Parameter:
    case NameCasingType.Variable:
      return `${camelCase(name)}`;
    default:
      return `${pascalCase(name)}`;
  }
}

export function ensureCSharpIdentifier(
  program: Program,
  target: Type,
  name: string,
  context: NameCasingType = NameCasingType.Class,
): string {
  let location = "";
  switch (target.kind) {
    case "Enum":
      location = `enum ${target.name}`;
      break;
    case "EnumMember":
      location = `enum ${target.enum.name}`;
      break;
    case "Interface":
      location = `interface ${target.name}`;
      break;
    case "Model":
      location = `model ${target.name}`;
      break;
    case "ModelProperty": {
      const model = target.model;
      if (!model) {
        reportDiagnostic(program, {
          code: "missing-type-parent",
          format: { type: "ModelProperty", name: target.name },
          target: target,
        });
      } else {
        location = `property '${target.name}' in model ${model?.name}`;
        if (!model.name) {
          location = `parameter '${target.name}' in operation`;
        }
      }
      break;
    }
    case "Namespace":
      location = `namespace ${target.name}`;
      let invalid: boolean = false;
      const nsName: StringBuilder = new StringBuilder();
      for (const part of name.split(".")) {
        if (!isValidCSharpIdentifier(part)) {
          invalid = true;
          nsName.pushLiteralSegment(transformInvalidIdentifier(part));
        }
      }

      if (invalid) {
        reportDiagnostic(program, {
          code: "invalid-identifier",
          format: { identifier: name, location: location },
          target: target.node ?? NoTarget,
        });
        return nsName.segments.join(".");
      }
      return name;
    case "Operation": {
      const parent = target.interface
        ? `interface ${target.interface.name}`
        : `namespace ${target.namespace?.name}`;
      location = `operation ${target.name} in ${parent}`;
      break;
    }
    case "Union":
      location = `union ${target.name}`;
      break;
    case "UnionVariant": {
      if (target.node !== undefined) {
        const parent = program.checker.getTypeForNode(target.node.parent!);
        if (parent?.kind === "Union")
          location = `variant ${String(target.name)} in union ${parent?.name}`;
      }
      break;
    }
  }

  if (!isValidCSharpIdentifier(name)) {
    reportDiagnostic(program, {
      code: "invalid-identifier",
      format: { identifier: name, location: location },
      target: target.node ?? NoTarget,
    });

    return getCSharpIdentifier(transformInvalidIdentifier(name), context);
  }

  return getCSharpIdentifier(name, context);
}

export function getModelAttributes(
  program: Program,
  entity: Type,
  csharpName?: string,
): Attribute[] {
  return getAttributes(program, entity);
}

export function getModelInstantiationName(program: Program, model: Model, name: string): string {
  const friendlyName = getFriendlyName(program, model);
  if (friendlyName && friendlyName.length > 0) return friendlyName;
  if (name === undefined || name.length < 1)
    name = ensureCSharpIdentifier(program, model, "", NameCasingType.Class);
  const names: string[] = [name];
  if (model.templateMapper !== undefined) {
    for (const paramType of model.templateMapper!.args) {
      if (paramType.entityKind === "Type") {
        switch (paramType.kind) {
          case "Enum":
          case "EnumMember":
          case "Model":
          case "ModelProperty":
          case "Namespace":
          case "Scalar":
          case "Union":
            names.push(
              getCSharpIdentifier(paramType?.name ?? paramType.kind, NameCasingType.Class),
            );
            break;
          default:
            names.push(getCSharpIdentifier(paramType.kind, NameCasingType.Class));
            break;
        }
      }
    }
  }

  return ensureCSharpIdentifier(program, model, names.join(""), NameCasingType.Class);
}

export class ModelInfo {
  visited: Model[] = [];
  getAllProperties(program: Program, model: Model): ModelProperty[] | undefined {
    if (this.visited.includes(model)) return undefined;
    this.visited.push(model);
    const props: ModelProperty[] = [];
    for (const prop of model.properties.values()) props.push(prop);
    if (model.baseModel) {
      const additional = this.getAllProperties(program, model.baseModel);
      if (additional !== undefined) props.concat(additional);
    }

    return props;
  }

  filterAllProperties(
    program: Program,
    model: Model,
    filter: (p: ModelProperty) => boolean,
  ): ModelProperty | undefined {
    if (this.visited.includes(model)) return undefined;
    this.visited.push(model);
    for (const prop of model.properties.values()) {
      if (filter(prop)) return prop;
    }

    if (model.baseModel !== undefined) {
      return this.filterAllProperties(program, model.baseModel, filter);
    }

    return undefined;
  }
}

export function getPropertySource(program: Program, property: ModelProperty): Model | undefined {
  let result: Model | undefined = property.model;
  while (property.sourceProperty !== undefined) {
    const current = property.sourceProperty;
    result = current.model;
    property = property.sourceProperty;
  }

  return result;
}

export function getSourceModel(program: Program, model: Model): Model | undefined {
  const modelTracker: Set<Model> = new Set<Model>();
  for (const prop of model.properties.values()) {
    const source = getPropertySource(program, prop);
    if (source === undefined) return undefined;
    modelTracker.add(source);
  }

  if (modelTracker.size === 1) return [...modelTracker.values()][0];

  return undefined;
}
export class HttpMetadata {
  resolveLogicalResponseType(program: Program, response: HttpOperationResponse): Type {
    const responseType: Type = response.type;
    const metaInfo: MetadataInfo = createMetadataInfo(program, {
      canonicalVisibility: Visibility.Read,
      canShareProperty: (p) => true,
    });
    switch (responseType.kind) {
      case "Model":
        const bodyProp = new ModelInfo().filterAllProperties(
          program,
          responseType,
          (p: ModelProperty) => isBody(program, p) || isBodyRoot(program, p),
        );
        if (bodyProp !== undefined)
          return metaInfo.getEffectivePayloadType(bodyProp.type, Visibility.Read);

        const anyProp = new ModelInfo().filterAllProperties(
          program,
          responseType,
          (p: ModelProperty) => !isMetadata(program, p) && !isStatusCode(program, p),
        );

        if (anyProp === undefined) return program.checker.voidType;

        if (responseType.name === "") {
          return metaInfo.getEffectivePayloadType(responseType, Visibility.Read);
        }
        break;
    }

    return responseType;
  }
}

export function getOperationAttributes(program: Program, entity: Type): Attribute[] {
  return getAttributes(program, entity);
}

export function transformInvalidIdentifier(name: string): string {
  const result: StringBuilder = new StringBuilder();
  for (let i = 0; i < name.length; ++i) {
    result.pushLiteralSegment(getValidChar(name.charAt(i), i));
  }
  return result.segments.join("");
}

export function getOperationVerbDecorator(operation: HttpOperation): string {
  switch (operation.verb) {
    case "delete":
      return "HttpDelete";
    case "get":
      return "HttpGet";
    case "patch":
      return "HttpPatch";
    case "post":
      return "HttpPost";
    case "put":
      return "HttpPut";
    default:
      return "HttpGet";
  }
}

export function hasNonMetadataProperties(program: Program, model: Model): boolean {
  const props = [...model.properties.values()].filter((p) => !isMetadata(program, p));

  return props.length > 0;
}

export async function ensureCleanDirectory(program: Program, targetPath: string) {
  try {
    await program.host.stat(targetPath);
    await program.host.rm(targetPath, { recursive: true });
  } catch {}

  await program.host.mkdirp(targetPath);
}

export function isValidCSharpIdentifier(identifier: string): boolean {
  return identifier?.match(/^[A-Za-z_][\w]*$/) !== null;
}

export function getValidChar(target: string, position: number): string {
  if (position === 0) {
    if (target.match(/[A-Za-z_]/)) return target;
    return `Generated_${target.match(/\w/) ? target : ""}`;
  }
  if (!target.match(/[\w]/)) return "_";
  return target;
}

export function getCSharpStatusCode(entry: HttpStatusCodesEntry): string | undefined {
  switch (entry) {
    case 200:
      return "HttpStatusCode.OK";
    case 201:
      return "HttpStatusCode.Created";
    case 202:
      return "HttpStatusCode.Accepted";
    case 204:
      return "HttpStatusCode.NoContent";
    default:
      return undefined;
  }
}
