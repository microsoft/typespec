import {
  IntrinsicScalarName,
  IntrinsicType,
  Model,
  ModelProperty,
  NoTarget,
  NumericLiteral,
  Program,
  Scalar,
  StringTemplateSpan,
  Type,
  Union,
  getFriendlyName,
  isNullType,
  isNumericType,
  isTemplateInstance,
  isUnknownType,
  isVoidType,
} from "@typespec/compiler";
import {
  AssetEmitter,
  EmitterOutput,
  StringBuilder,
  code,
} from "@typespec/compiler/emitter-framework";
import {
  HttpOperation,
  HttpOperationParameter,
  HttpOperationResponse,
  HttpStatusCodesEntry,
  MetadataInfo,
  Visibility,
  createMetadataInfo,
  getHeaderFieldName,
  isBody,
  isBodyRoot,
  isHeader,
  isMetadata,
  isPathParam,
  isQueryParam,
  isStatusCode,
} from "@typespec/http";
import { HttpRequestParameterKind } from "@typespec/http/experimental/typekit";
import { camelCase, pascalCase } from "change-case";
import { getAttributes } from "./attributes.js";
import {
  Attribute,
  BooleanValue,
  CSharpOperationParameter,
  CSharpType,
  CSharpValue,
  NameCasingType,
  NullValue,
  NumericValue,
  StringValue,
} from "./interfaces.js";
import { CSharpServiceEmitterOptions, reportDiagnostic } from "./lib.js";

const _scalars: Map<Scalar, CSharpType> = new Map<Scalar, CSharpType>();
export function getCSharpTypeForScalar(program: Program, scalar: Scalar): CSharpType {
  if (_scalars.has(scalar)) return _scalars.get(scalar)!;
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

  const result = new CSharpType({
    name: "object",
    namespace: "System",
    isBuiltIn: true,
    isValueType: false,
  });

  _scalars.set(scalar, result);
  return result;
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
  namespace?: string,
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
          namespace: namespace || "Models",
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
        name = getModelInstantiationName(program, type, name);
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
  namespace?: string,
): { type: CSharpType; value?: CSharpValue } {
  const visited = new Map<Type, { type: CSharpType; value?: CSharpValue }>();
  let candidateType: CSharpType | undefined = undefined;
  let candidateValue: CSharpValue | undefined = undefined;
  for (const type of types) {
    if (!isNullType(type)) {
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
  if (isUnknownType(type)) {
    return { type: UnknownType };
  }
  if (isVoidType(type)) {
    return {
      type: new CSharpType({
        name: "void",
        namespace: "System",
        isBuiltIn: true,
        isValueType: false,
      }),
    };
  }
  if (isNullType(type)) {
    return {
      type: new CSharpType({
        name: "object",
        namespace: "System",
        isBuiltIn: true,
        isValueType: false,
      }),
      value: new NullValue(),
    };
  }

  return undefined;
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
  const cached: CSharpType | undefined = _scalars.get(scalar);
  if (cached !== undefined) return cached;
  const builtIn: CSharpType | undefined = standardScalars.get(scalar.name);
  if (builtIn !== undefined) {
    _scalars.set(scalar, builtIn);
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
  if (
    type.kind === "Boolean" ||
    type.kind === "Number" ||
    type.kind === "Enum" ||
    type.kind === "EnumMember"
  )
    return true;
  if (type.kind === "Scalar") return getCSharpTypeForScalar(program, type).isValueType;
  if (type.kind !== "Union") return false;
  return [...type.variants.values()]
    .flatMap((v) => v.type)
    .every((t) => isNullType(t) || isValueType(program, t));
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
  cSharpName?: string,
): Attribute[] {
  return getAttributes(program, entity, cSharpName);
}

export function getModelDeclarationName(program: Program, model: Model, name: string) {
  if (name !== null && name.length > 0) {
    return ensureCSharpIdentifier(program, model, name, NameCasingType.Class);
  }
  return ensureCSharpIdentifier(program, model, "", NameCasingType.Class);
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

export function isEmptyResponseModel(program: Program, model: Type): boolean {
  if (model.kind !== "Model") return false;
  return model.properties.size === 1 && isStatusCode(program, [...model.properties.values()][0]);
}

export function isContentTypeHeader(program: Program, parameter: ModelProperty): boolean {
  return (
    isHeader(program, parameter) &&
    (parameter.name === "contentType" || getHeaderFieldName(program, parameter) === "Content-type")
  );
}

export function isValidParameter(program: Program, parameter: ModelProperty): boolean {
  return (
    !isContentTypeHeader(program, parameter) &&
    (parameter.type.kind !== "Intrinsic" || parameter.type.name !== "never") &&
    parameter.model?.name === ""
  );
}

/** Determine whether the given parameter is http metadata */
export function isHttpMetadata(program: Program, property: ModelProperty) {
  return (
    isPathParam(program, property) || isHeader(program, property) || isQueryParam(program, property)
  );
}

export function getBusinessLogicCallParameters(
  parameters: CSharpOperationParameter[],
): EmitterOutput<string> {
  const builder: StringBuilder = new StringBuilder();
  const blParameters = parameters.filter(
    (p) => p.operationKind === "BusinessLogic" || p.operationKind === "All",
  );
  let i = 0;
  for (const param of blParameters) {
    builder.push(
      code`${getBusinessLogicCallParameter(param)}${++i < blParameters.length ? ", " : ""}`,
    );
  }
  return builder.reduce();
}

export function getBusinessLogicDeclParameters(
  parameters: CSharpOperationParameter[],
): EmitterOutput<string> {
  const builder: StringBuilder = new StringBuilder();
  const blParameters = parameters.filter(
    (p) => p.operationKind === "BusinessLogic" || p.operationKind === "All",
  );
  let i = 0;
  for (const param of blParameters) {
    builder.push(
      code`${getBusinessLogicSignatureParameter(param)}${++i < blParameters.length ? ", " : ""}`,
    );
  }
  return builder.reduce();
}

export function getHttpDeclParameters(
  parameters: CSharpOperationParameter[],
): EmitterOutput<string> {
  const builder: StringBuilder = new StringBuilder();
  const blParameters = parameters.filter(
    (p) => p.operationKind === "Http" || p.operationKind === "All",
  );
  let i = 0;
  for (const param of blParameters) {
    builder.push(code`${getHttpSignatureParameter(param)}${++i < blParameters.length ? ", " : ""}`);
  }
  return builder.reduce();
}
export function getBusinessLogicCallParameter(
  param: CSharpOperationParameter,
): EmitterOutput<string> {
  const builder: StringBuilder = new StringBuilder();
  builder.push(code`${param.callName}`);
  return builder.reduce();
}

export function getBusinessLogicSignatureParameter(
  param: CSharpOperationParameter,
): EmitterOutput<string> {
  const builder: StringBuilder = new StringBuilder();
  builder.push(
    code`${param.typeName}${param.optional || param.nullable ? "? " : " "}${param.name}`,
  );
  return builder.reduce();
}

export function getHttpSignatureParameter(param: CSharpOperationParameter): EmitterOutput<string> {
  const builder: StringBuilder = new StringBuilder();
  builder.push(
    code`${getHttpParameterDecorator(param)}${getBusinessLogicSignatureParameter(param)}${param.defaultValue === undefined ? "" : code` = ${typeof param.defaultValue === "boolean" ? code`${param.defaultValue.toString()}` : code`${param.defaultValue}`}`}`,
  );
  return builder.reduce();
}

export function getHttpParameterDecorator(
  parameter: CSharpOperationParameter,
): EmitterOutput<string> {
  switch (parameter.httpParameterKind) {
    case "query":
      return code`[FromQuery${parameter.httpParameterName ? code`(Name="${parameter.httpParameterName}")` : ""}] `;
    case "header":
      return code`[FromHeader${parameter.httpParameterName ? code`(Name="${parameter.httpParameterName}")` : ""}] `;
    default:
      return "";
  }
}

export function getParameterKind(parameter: HttpOperationParameter): HttpRequestParameterKind {
  switch (parameter.type) {
    case "path":
      return "path";
    case "cookie":
    case "header":
      return "header";
    case "query":
      return "query";
  }
}

export function canHaveDefault(program: Program, type: Type): boolean {
  switch (type.kind) {
    case "Boolean":
    case "EnumMember":
    case "Enum":
    case "Number":
    case "String":
    case "Scalar":
    case "StringTemplate":
      return true;
    case "ModelProperty":
      return canHaveDefault(program, type.type);
    default:
      return false;
  }
}
export function getCSharpOperationParameters(
  program: Program,
  operation: HttpOperation,
  emitter: AssetEmitter<string, CSharpServiceEmitterOptions>,
): CSharpOperationParameter[] {
  const bodyParam = operation.parameters.body;
  const isExplicitBodyParam: boolean = bodyParam?.property !== undefined;
  const result: CSharpOperationParameter[] = [];
  const validParams: HttpOperationParameter[] = operation.parameters.parameters.filter((p) =>
    isValidParameter(program, p.param),
  );
  const requiredParams: HttpOperationParameter[] = validParams.filter(
    (p) => p.type === "path" || (!p.param.optional && p.param.defaultValue === undefined),
  );
  const optionalParams: HttpOperationParameter[] = validParams.filter(
    (p) => p.type !== "path" && (p.param.optional || p.param.defaultValue !== undefined),
  );
  for (const parameter of requiredParams) {
    let [paramType, paramValue, _] = getTypeInfoForTsType(program, parameter.param.type, emitter);
    // cSharp does not allow array defaults in operation parameters
    if (!canHaveDefault(program, parameter.param)) {
      paramValue = undefined;
    }
    const paramName = ensureCSharpIdentifier(
      program,
      parameter.param,
      parameter.param.name,
      NameCasingType.Parameter,
    );
    result.push({
      isExplicitBody: false,
      name: paramName,
      callName: paramName,
      optional: false,
      typeName: paramType,
      defaultValue: paramValue,
      httpParameterKind: getParameterKind(parameter),
      httpParameterName: parameter.name,
      nullable: false,
      operationKind: "All",
    });
  }

  const overrideParameters = getExplicitBodyParameters(program, operation);
  if (overrideParameters !== undefined) {
    for (const overrideParam of overrideParameters) {
      result.push(overrideParam);
    }
  } else if (bodyParam !== undefined && isExplicitBodyParam) {
    let [bodyType, bodyValue, isNullable] = getTypeInfoForTsType(program, bodyParam.type, emitter);
    if (!canHaveDefault(program, bodyParam.type)) {
      bodyValue = undefined;
    }
    result.push({
      isExplicitBody: true,
      httpParameterKind: "body",
      name: "body",
      callName: "body",
      typeName: bodyType,
      nullable: isNullable,
      defaultValue: bodyValue,
      optional: bodyParam.property?.optional ?? false,
      operationKind: "All",
    });
  } else if (bodyParam !== undefined) {
    switch (bodyParam.type.kind) {
      case "Model":
        const [bodyType, _, __] = getTypeInfoForTsType(program, bodyParam.type, emitter);
        const bodyName = ensureCSharpIdentifier(
          program,
          bodyParam.type,
          "body",
          NameCasingType.Parameter,
        );
        result.push({
          isExplicitBody: false,
          httpParameterKind: "body",
          name: bodyName,
          callName: bodyName,
          typeName: bodyType,
          nullable: false,
          defaultValue: undefined,
          optional: false,
          operationKind: "Http",
        });
        for (const [propName, propDef] of bodyParam.type.properties) {
          let [csType, csValue, isNullable] = getTypeInfoForTsType(program, propDef.type, emitter);
          // cSharp does not allow array defaults in operation parameters
          if (!canHaveDefault(program, propDef)) {
            csValue = undefined;
          }
          const paramName = ensureCSharpIdentifier(
            program,
            propDef,
            propName,
            NameCasingType.Parameter,
          );
          const refName = ensureCSharpIdentifier(
            program,
            propDef,
            propName,
            NameCasingType.Property,
          );
          result.push({
            isExplicitBody: false,
            httpParameterKind: "body",
            name: paramName,
            callName: `body.${refName}`,
            typeName: csType,
            nullable: isNullable,
            defaultValue: csValue,
            optional: propDef.optional,
            operationKind: "BusinessLogic",
          });
        }
        break;
      case "ModelProperty":
        {
          let [csType, csValue, isNullable] = getTypeInfoForTsType(
            program,
            bodyParam.type.type,
            emitter,
          );
          if (!canHaveDefault(program, bodyParam.type)) {
            csValue = undefined;
          }
          const optName = ensureCSharpIdentifier(
            program,
            bodyParam.type.type,
            bodyParam.type.name,
            NameCasingType.Parameter,
          );
          result.push({
            isExplicitBody: true,
            httpParameterKind: "body",
            name: optName,
            callName: optName,
            typeName: csType,
            nullable: isNullable,
            defaultValue: csValue,
            optional: bodyParam.type.optional,
            operationKind: "All",
          });
        }
        break;
      default: {
        let [csType, csValue, isNullable] = getTypeInfoForTsType(program, bodyParam.type, emitter);
        if (!canHaveDefault(program, bodyParam.type)) {
          csValue = undefined;
        }
        result.push({
          isExplicitBody: true,
          httpParameterKind: "body",
          name: "body",
          callName: "body",
          typeName: csType,
          nullable: isNullable,
          defaultValue: csValue,
          optional: false,
          operationKind: "All",
        });
      }
    }
  }

  for (const parameter of optionalParams) {
    const [paramType, paramValue, isNullable] = getTypeInfoForTsType(
      program,
      parameter.param.type,
      emitter,
    );
    const optName = ensureCSharpIdentifier(
      program,
      parameter.param,
      parameter.param.name,
      NameCasingType.Parameter,
    );
    result.push({
      isExplicitBody: false,
      name: optName,
      callName: optName,
      optional: true,
      typeName: paramType,
      defaultValue: paramValue,
      httpParameterKind: getParameterKind(parameter),
      httpParameterName: parameter.name,
      nullable: isNullable,
      operationKind: "All",
    });
  }

  return result;
}

export function getTypeInfoForTsType(
  program: Program,
  tsType: Type,
  emitter: AssetEmitter<string, CSharpServiceEmitterOptions>,
): [EmitterOutput<string>, string | boolean | undefined, boolean] {
  function extractStringValue(type: Type, span: StringTemplateSpan): string {
    switch (type.kind) {
      case "String":
        return type.value;
      case "Boolean":
        return `${type.value}`;
      case "Number":
        return type.valueAsString;
      case "StringTemplateSpan":
        if (type.isInterpolated) {
          return extractStringValue(type.type, span);
        } else {
          return type.type.value;
        }
      case "ModelProperty":
        return extractStringValue(type.type, span);
      case "EnumMember":
        if (type.value === undefined) return type.name;
        if (typeof type.value === "string") return type.value;
        if (typeof type.value === "number") return `${type.value}`;
    }
    reportDiagnostic(emitter.getProgram(), {
      code: "invalid-interpolation",
      target: span,
      format: {},
    });
    return "";
  }
  switch (tsType.kind) {
    case "String":
      return [code`string`, `"${tsType.value}"`, false];
    case "StringTemplate":
      const template = tsType;
      if (template.stringValue !== undefined)
        return [code`string`, `"${template.stringValue}"`, false];
      const spanResults: string[] = [];
      for (const span of template.spans) {
        spanResults.push(extractStringValue(span, span));
      }
      return [code`string`, `"${spanResults.join("")}"`, false];
    case "Boolean":
      return [code`bool`, `${tsType.value === true ? true : false}`, false];
    case "Number":
      const [type, value] = findNumericType(tsType);
      return [code`${type}`, `${value}`, false];
    case "Tuple":
      const defaults = [];
      const [csharpType, isObject] = coalesceTsTypes(program, tsType.values);
      if (isObject) return ["object[]", undefined, false];
      for (const value of tsType.values) {
        const [_, itemDefault] = getTypeInfoForTsType(program, value, emitter);
        defaults.push(itemDefault);
      }
      return [
        code`${csharpType.getTypeReference()}[]`,
        `[${defaults.join(", ")}]`,
        csharpType.isNullable,
      ];
    case "Object":
      return [code`object`, undefined, false];
    case "Model":
      if (isRecord(tsType)) {
        return [code`JsonObject`, undefined, false];
      }
      return [code`${emitter.emitTypeReference(tsType)}`, undefined, false];
    case "ModelProperty":
      return getTypeInfoForTsType(program, tsType.type, emitter);
    case "Enum":
      return [code`${emitter.emitTypeReference(tsType)}`, undefined, false];
    case "EnumMember":
      if (typeof tsType.value === "number") {
        const stringValue = tsType.value.toString();
        if (stringValue.includes(".") || stringValue.includes("e"))
          return ["double", stringValue, false];
        return ["int", stringValue, false];
      }
      if (typeof tsType.value === "string") {
        return ["string", tsType.value, false];
      }
      return [code`object`, undefined, false];
    case "Union":
      return getTypeInfoForUnion(program, tsType, emitter);
    case "UnionVariant":
      return getTypeInfoForTsType(program, tsType.type, emitter);
    default:
      return [code`${emitter.emitTypeReference(tsType)}`, undefined, false];
  }
}

export function getExplicitBodyParameters(
  program: Program,
  httpOperation: HttpOperation,
): CSharpOperationParameter[] | undefined {
  if (httpOperation.parameters.body && httpOperation.parameters.body.bodyKind === "multipart") {
    return [
      {
        name: "reader",
        callName: "reader",
        nullable: false,
        optional: false,
        typeName: "MultipartReader",
        isExplicitBody: false,
        httpParameterKind: "body",
        operationKind: "BusinessLogic",
      },
    ];
  }

  return undefined;
}
export function getTypeInfoForUnion(
  program: Program,
  union: Union,
  emitter: AssetEmitter<string, CSharpServiceEmitterOptions>,
): [EmitterOutput<string>, string | boolean | undefined, boolean] {
  const propResult = getNonNullableTsType(union);
  if (propResult === undefined) {
    return [
      code`${emitter.emitTypeReference(union)}`,
      undefined,
      [...union.variants.values()].filter((v) => isNullType(v.type)).length > 0,
    ];
  }
  const [typeName, typeDefault, _] = getTypeInfoForTsType(program, propResult.type, emitter);
  return [typeName, typeDefault, propResult.nullable];
}

export function findNumericType(type: NumericLiteral): [string, string] {
  const stringValue = type.valueAsString;
  if (stringValue.includes(".") || stringValue.includes("e")) return ["double", stringValue];
  return ["int", stringValue];
}

export function coalesceUnionTypes(program: Program, union: Union): CSharpType {
  const [result, _] = coalesceTsTypes(
    program,
    [...union.variants.values()].flatMap((v) => v.type),
  );
  return result;
}

export function getNonNullableTsType(union: Union): { type: Type; nullable: boolean } | undefined {
  const types = [...union.variants.values()];
  const nulls = types.flatMap((v) => v.type).filter((t) => isNullType(t));
  const nonNulls = types.flatMap((v) => v.type).filter((t) => !isNullType(t));
  if (nonNulls.length === 1) return { type: nonNulls[0], nullable: nulls.length > 0 };
  return undefined;
}

export function coalesceTsTypes(program: Program, types: Type[]): [CSharpType, boolean] {
  const defaultValue: [CSharpType, boolean] = [
    new CSharpType({
      name: "object",
      namespace: "System",
      isBuiltIn: true,
      isValueType: false,
    }),
    true,
  ];
  let current: CSharpType | undefined = undefined;
  let nullable: boolean = false;
  for (const type of types) {
    let candidate: CSharpType | undefined = undefined;
    switch (type.kind) {
      case "Boolean":
        candidate = new CSharpType({ name: "bool", namespace: "System", isValueType: true });
        break;
      case "StringTemplate":
      case "String":
        candidate = new CSharpType({ name: "string", namespace: "System", isValueType: false });
        break;
      case "Number":
        const stringValue = type.valueAsString;
        if (stringValue.includes(".") || stringValue.includes("e")) {
          candidate = new CSharpType({
            name: "double",
            namespace: "System",
            isValueType: true,
          });
        } else {
          candidate = new CSharpType({ name: "int", namespace: "System", isValueType: true });
        }
        break;
      case "Union":
        candidate = coalesceUnionTypes(program, type);
        break;
      case "Scalar":
        candidate = getCSharpTypeForScalar(program, type);
        break;
      case "Intrinsic":
        if (isNullType(type)) {
          nullable = true;
          candidate = current;
        } else {
          return defaultValue;
        }
        break;
      default:
        return defaultValue;
    }

    current = current ?? candidate;
    if (current === undefined || (candidate !== undefined && !candidate.equals(current)))
      return defaultValue;
  }

  if (current !== undefined && nullable) current.isNullable = true;
  return current === undefined ? defaultValue : [current, false];
}

export function isRecord(type: Type): boolean {
  return type.kind === "Model" && type.name === "Record" && type.indexer !== undefined;
}
