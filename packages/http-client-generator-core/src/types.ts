import {
  BooleanLiteral,
  Diagnostic,
  EncodeData,
  Enum,
  EnumMember,
  IntrinsicScalarName,
  IntrinsicType,
  Model,
  ModelProperty,
  Namespace,
  NumericLiteral,
  Operation,
  Scalar,
  StringLiteral,
  Tuple,
  Type,
  Union,
  createDiagnosticCollector,
  getDiscriminator,
  getEncode,
  getLifecycleVisibilityEnum,
  getSummary,
  getVisibilityForClass,
  ignoreDiagnostics,
  isArrayModelType,
  isErrorModel,
  isNeverType,
  isTemplateDeclaration,
  resolveEncodedName,
} from "@typespec/compiler";
import {
  Authentication,
  HttpOperationFileBody,
  HttpOperationMultipartBody,
  HttpPayloadBody,
  Visibility,
  getAuthentication,
  getServers,
  isHeader,
  isOrExtendsHttpFile,
  isStatusCode,
} from "@typespec/http";
import { getStreamMetadata } from "@typespec/http/experimental";
import { getStreamOf, isStream } from "@typespec/streams";
import {
  getAccess,
  getAccessOverride,
  getAlternateType,
  getClientDefaultValue,
  getClientNamespace,
  getExplicitClientApiVersions,
  getLegacyHierarchyBuilding,
  getOverriddenClientMethod,
  getUsageOverride,
  isInScope,
  listClients,
  listOperationsInClient,
  listSubClients,
  shouldFlattenProperty,
  shouldGenerateConvenient,
} from "./decorators.js";
import {
  AccessFlags,
  ArrayKnownEncoding,
  SdkArrayType,
  SdkBuiltInKinds,
  SdkBuiltInType,
  SdkClientType,
  SdkConstantType,
  SdkCredentialParameter,
  SdkCredentialType,
  SdkDateTimeType,
  SdkDictionaryType,
  SdkDurationType,
  SdkEnumType,
  SdkEnumValueType,
  SdkHeaderParameter,
  SdkHttpOperation,
  SdkModelPropertyType,
  SdkModelPropertyTypeBase,
  SdkModelType,
  SdkNullableType,
  SdkTupleType,
  SdkType,
  SdkUnionType,
  TCGCContext,
  UsageFlags,
  isSdkIntKind,
} from "./interfaces.js";
import {
  ContextNode,
  createGeneratedName,
  filterPreviewVersion,
  getAvailableApiVersions,
  getClientDoc,
  getHttpBodyType,
  getHttpOperationResponseHeaders,
  getNonNullOptions,
  getNullOption,
  getSdkTypeBaseHelper,
  getTypeDecorators,
  hasNoneVisibility,
  intOrFloat,
  isHttpBodySpread,
  isNeverOrVoidType,
  isOnClient,
  listOrphanTypes,
  resolveConflictGeneratedName,
  updateWithApiVersionInformation,
} from "./internal-utils.js";
import { createDiagnostic } from "./lib.js";
import {
  getCrossLanguageDefinitionId,
  getEffectivePayloadType,
  getGeneratedName,
  getHttpOperationWithCache,
  getLibraryName,
  getPropertyNames,
} from "./public-utils.js";

import { $ } from "@typespec/compiler/typekit";
import { getNs, isAttribute, isUnwrapped } from "@typespec/xml";
import { pascalCase } from "change-case";
import pluralize from "pluralize";
import { getSdkHttpParameter } from "./http.js";
import { isMediaTypeJson, isMediaTypeTextPlain, isMediaTypeXml } from "./media-types.js";

/**
 * Represents a union that can be treated as an enum.
 * This is a local definition for union-as-enum conversion.
 */
interface UnionEnumVariant<T> {
  value: T;
  type: import("@typespec/compiler").UnionVariant | EnumMember;
}

interface UnionEnumBase<K extends string, T> {
  kind: K;
  union: Union;
  members: Map<string | symbol, UnionEnumVariant<T>>;
  include: UnionEnumBase<K, T>;
  flattenedMembers: Map<string | symbol, UnionEnumVariant<T>>;
  open: boolean;
  nullable: boolean;
}

export type UnionEnum = UnionEnumBase<"string", string> | UnionEnumBase<"number", number>;

/**
 * Stub for getUnionAsEnum. In the core package this is a no-op.
 * The Azure wrapper package provides the full implementation.
 */
function getUnionAsEnum(
  union: Union,
): [UnionEnum | undefined, readonly import("@typespec/compiler").Diagnostic[]] {
  return getUnionAsEnumInternal(union, new Set());
}

function getUnionAsEnumInternal(
  union: Union,
  visited: Set<Union>,
): [UnionEnum | undefined, readonly import("@typespec/compiler").Diagnostic[]] {
  if (visited.has(union)) {
    return [undefined, []];
  }
  visited.add(union);
  const diagnostics = createDiagnosticCollector();

  const kinds = new Set<UnionEnum["kind"]>();
  const members = new Map<string | symbol, UnionEnumVariant<any>>();
  const flattenedMembers = new Map<string | symbol, UnionEnumVariant<any>>();
  let open = false;
  let nullable = false;

  for (const variant of union.variants.values()) {
    switch (variant.type.kind) {
      case "Intrinsic":
        if (variant.type.name === "null") {
          nullable = true;
        } else {
          return diagnostics.wrap(undefined);
        }
        break;
      case "String":
        kinds.add("string");
        members.set(variant.name, { value: variant.type.value, type: variant });
        break;
      case "Number":
        kinds.add("number");
        members.set(variant.name, { value: variant.type.value, type: variant });
        break;
      case "Union": {
        const parentUnion = diagnostics.pipe(getUnionAsEnumInternal(variant.type, visited));
        if (parentUnion !== undefined) {
          kinds.add(parentUnion.kind);
          if (parentUnion.open) open = true;
          if (parentUnion.nullable) nullable = true;
          for (const [key, value] of parentUnion.flattenedMembers) {
            flattenedMembers.set(key, value);
          }
        }
        break;
      }
      case "Enum":
        for (const member of variant.type.members.values()) {
          kinds.add(typeof member.value === "number" ? "number" : "string");
          flattenedMembers.set(member.name, { value: member.value ?? member.name, type: member });
        }
        break;
      case "Scalar": {
        const scalar = variant.type;
        switch (scalar.name) {
          case "string":
            kinds.add("string");
            open = true;
            break;
          case "float":
          case "float32":
          case "float64":
          case "integer":
          case "int8":
          case "int16":
          case "int32":
          case "int64":
          case "uint8":
          case "uint16":
          case "uint32":
          case "uint64":
            kinds.add("number");
            open = true;
            break;
          default:
            return diagnostics.wrap(undefined);
        }
        break;
      }
      default:
        return diagnostics.wrap(undefined);
    }
  }

  for (const [key, value] of members) {
    flattenedMembers.set(key, value);
  }

  if (kinds.size > 1 || diagnostics.diagnostics.length > 0) {
    return diagnostics.wrap(undefined);
  }

  if (flattenedMembers.size === 0) {
    return [undefined, []];
  }

  return [
    {
      kind: [...kinds][0],
      union,
      members,
      flattenedMembers,
      open,
      nullable,
    } as any,
    [],
  ];
}

/**
 * Push a naming context node onto the stack. The stack is read by getGeneratedName/getCrossLanguageDefinitionId
 * to determine names for anonymous types without DFS.
 */
function pushNamingContext(context: TCGCContext, name: string, type: ContextNode["type"]): void {
  context.__namingContextPath.push({ name, type });
}

function popNamingContext(context: TCGCContext): void {
  context.__namingContextPath.pop();
}

export function getTypeSpecBuiltInType(
  context: TCGCContext,
  kind: IntrinsicScalarName,
): SdkBuiltInType {
  const global = context.getMutatedGlobalNamespace(); // since other build in types have been mutated, we need to use the mutated global namespace
  const typeSpecNamespace = global.namespaces!.get("TypeSpec");
  const type = typeSpecNamespace!.scalars.get(kind)!;

  return getSdkBuiltInType(context, type) as SdkBuiltInType;
}

function getUnknownType(context: TCGCContext, type: Type): [SdkBuiltInType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const unknownType: SdkBuiltInType = {
    ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "unknown")),
    name: getLibraryName(context, type),
    encode: undefined,
    crossLanguageDefinitionId: "",
  };
  return diagnostics.wrap(unknownType);
}

/**
 * Add encoding info onto an sdk type. Since the encoding decorator
 * decorates the ModelProperty, we add the encoding info onto the property's internal
 * type.
 * @param context sdk context
 * @param type the original typespec type. Used to grab the encoding decorator off of
 * @param propertyType the type of the property, i.e. the internal type that we add the encoding info onto
 */
export function addEncodeInfo(
  context: TCGCContext,
  type: ModelProperty | Scalar,
  propertyType: SdkType,
  defaultContentType?: string,
): [void, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const alternateType = getAlternateType(context, type);
  if (
    alternateType &&
    (alternateType?.kind === "Scalar" || alternateType?.kind === "ModelProperty")
  ) {
    type = alternateType;
  }
  const innerType = propertyType.kind === "nullable" ? propertyType.type : propertyType;
  const encodeData = getEncode(context.program, type);
  if (innerType.kind === "duration") {
    if (!encodeData || !encodeData.encoding) return diagnostics.wrap(undefined);
    innerType.encode = encodeData.encoding;
    innerType.wireType = diagnostics.pipe(
      getClientTypeWithDiagnostics(context, encodeData.type),
    ) as SdkBuiltInType;
  }
  if (innerType.kind === "utcDateTime" || innerType.kind === "offsetDateTime") {
    if (encodeData && encodeData.encoding) {
      innerType.encode = encodeData.encoding;
      innerType.wireType = diagnostics.pipe(
        getClientTypeWithDiagnostics(context, encodeData.type),
      ) as SdkBuiltInType;
    } else if (type.kind === "ModelProperty" && isHeader(context.program, type)) {
      innerType.encode = "rfc7231";
    }
  }
  if (innerType.kind === "bytes") {
    if (encodeData && encodeData.encoding) {
      innerType.encode = encodeData.encoding;
    } else if (type.kind === "Scalar" || !defaultContentType) {
      // for scalar bytes without specific encode, or no specific content type, fallback to base64
      innerType.encode = "base64";
    } else if (
      !isMediaTypeJson(defaultContentType) &&
      !isMediaTypeXml(defaultContentType) &&
      !isMediaTypeTextPlain(defaultContentType)
    ) {
      // for model property bytes with specific content type, will change to bytes for non-text content type
      innerType.encode = "bytes";
    }
  }
  if (isSdkIntKind(innerType.kind)) {
    // only integer type is allowed to be encoded as string
    if (encodeData) {
      if (encodeData?.encoding) {
        (innerType as any).encode = encodeData.encoding;
      }
      if (encodeData?.type) {
        // if we specify the encoding type in the decorator, we set the `.encode` string
        // to the kind of the encoding type
        (innerType as any).encode = getSdkBuiltInType(context, encodeData.type).kind;
      }
    }
  }
  return diagnostics.wrap(undefined);
}

/**
 * Mapping of typespec scalar kinds to the built in kinds exposed in the SDK
 * @param context the TCGC context
 * @param scalar the original typespec scalar
 * @returns the corresponding sdk built in kind
 */
function getScalarKind(context: TCGCContext, scalar: Scalar): IntrinsicScalarName | "unknown" {
  if (context.program.checker.isStdType(scalar)) {
    return scalar.name;
  }

  // for those scalar defined as `scalar newThing;`,
  // the best we could do here is return as a `any` type with a name and namespace and let the generator figure what this is
  if (scalar.baseScalar === undefined) {
    return "unknown";
  }

  return getScalarKind(context, scalar.baseScalar);
}

/**
 * This function converts a Scalar into SdkBuiltInType.
 * @param context
 * @param type
 * @param kind
 * @returns
 */
function getSdkBuiltInTypeWithDiagnostics(
  context: TCGCContext,
  type: Scalar,
  kind: SdkBuiltInKinds,
): [SdkBuiltInType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const stdType = {
    ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, kind)),
    name: getLibraryName(context, type),
    baseType:
      type.baseScalar && !context.program.checker.isStdType(type) // we only calculate the base type when this type has a base type and this type is not a std type because for std types there is no point of calculating its base type.
        ? diagnostics.pipe(getSdkBuiltInTypeWithDiagnostics(context, type.baseScalar, kind))
        : undefined,
    crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, type),
  };
  addEncodeInfo(context, type, stdType);
  return diagnostics.wrap(stdType);
}

/**
 * This function calculates the encode and wireType for a datetime or duration type.
 * We always first try to get the `@encode` decorator on this type and returns it if any.
 * If we did not get anything from the encode, we try to get the baseType's encode and wireType.
 * @param context
 * @param encodeData
 * @param baseType
 * @returns
 */
function getEncodeInfoForDateTimeOrDuration(
  context: TCGCContext,
  encodeData: EncodeData | undefined,
  baseType: SdkDateTimeType | SdkDurationType | undefined,
): [string | undefined, SdkBuiltInType | undefined] {
  const encode = encodeData?.encoding;
  const wireType = encodeData?.type
    ? (getClientType(context, encodeData.type) as SdkBuiltInType)
    : undefined;

  // if we get something from the encode
  if (encode || wireType) {
    return [encode, wireType];
  }

  // if we did not get anything from the encode, try the baseType
  return [baseType?.encode, baseType?.wireType];
}

/**
 * This function converts a Scalar into SdkDateTimeType.
 * @param context
 * @param type
 * @param kind
 * @returns
 */
function getSdkDateTimeType(
  context: TCGCContext,
  type: Scalar,
  kind: "utcDateTime" | "offsetDateTime",
): [SdkDateTimeType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const baseType =
    type.baseScalar && !context.program.checker.isStdType(type) // we only calculate the base type when this type has a base type and this type is not a std type because for std types there is no point of calculating its base type.
      ? diagnostics.pipe(getSdkDateTimeType(context, type.baseScalar, kind))
      : undefined;
  const [encode, wireType] = getEncodeInfoForDateTimeOrDuration(
    context,
    getEncode(context.program, type),
    baseType,
  );
  return diagnostics.wrap({
    ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, kind)),
    name: getLibraryName(context, type),
    encode: encode ?? "rfc3339",
    wireType: wireType ?? getTypeSpecBuiltInType(context, "string"),
    baseType: baseType,
    crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, type),
  });
}

function getSdkDateTimeOrDurationOrBuiltInType(
  context: TCGCContext,
  type: Scalar,
): [SdkDateTimeType | SdkDurationType | SdkBuiltInType, readonly Diagnostic[]] {
  // follow the extends hierarchy to determine the final kind of this type
  const kind = getScalarKind(context, type);

  if (kind === "utcDateTime" || kind === "offsetDateTime") {
    return getSdkDateTimeType(context, type, kind);
  }
  if (kind === "duration") {
    return getSdkDurationTypeWithDiagnostics(context, type, kind);
  }
  // handle the std types of typespec
  return getSdkBuiltInTypeWithDiagnostics(context, type, kind);
}

function getSdkTypeForLiteral(
  context: TCGCContext,
  type: NumericLiteral | StringLiteral | BooleanLiteral,
): SdkBuiltInType {
  let kind: SdkBuiltInKinds;

  if (type.kind === "String") {
    kind = "string";
  } else if (type.kind === "Boolean") {
    kind = "boolean";
  } else {
    kind = intOrFloat(type.value);
  }
  return getTypeSpecBuiltInType(context, kind);
}

function getSdkTypeForIntrinsic(context: TCGCContext, type: IntrinsicType): SdkBuiltInType {
  const kind = "unknown";
  const diagnostics = createDiagnosticCollector();
  return {
    ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, kind)),
    name: getLibraryName(context, type),
    crossLanguageDefinitionId: "",
    encode: kind,
  };
}

export function getSdkBuiltInType(
  context: TCGCContext,
  type: Scalar | IntrinsicType | NumericLiteral | StringLiteral | BooleanLiteral,
): SdkDateTimeType | SdkDurationType | SdkBuiltInType {
  switch (type.kind) {
    case "Scalar":
      return ignoreDiagnostics(getSdkDateTimeOrDurationOrBuiltInType(context, type));
    case "Intrinsic":
      return getSdkTypeForIntrinsic(context, type);
    case "String":
    case "Number":
    case "Boolean":
      return getSdkTypeForLiteral(context, type);
  }
}

export function getSdkDurationType(context: TCGCContext, type: Scalar): SdkDurationType {
  return ignoreDiagnostics(getSdkDurationTypeWithDiagnostics(context, type, "duration"));
}

/**
 * This function converts a Scalar into SdkDurationType.
 * @param context
 * @param type
 * @param kind
 * @returns
 */
function getSdkDurationTypeWithDiagnostics(
  context: TCGCContext,
  type: Scalar,
  kind: "duration",
): [SdkDurationType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const baseType =
    type.baseScalar && !context.program.checker.isStdType(type) // we only calculate the base type when this type has a base type and this type is not a std type because for std types there is no point of calculating its base type.
      ? diagnostics.pipe(getSdkDurationTypeWithDiagnostics(context, type.baseScalar, kind))
      : undefined;
  const [encode, wireType] = getEncodeInfoForDateTimeOrDuration(
    context,
    getEncode(context.program, type),
    baseType,
  );
  return diagnostics.wrap({
    ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, kind)),
    name: getLibraryName(context, type),
    encode: encode ?? "ISO8601",
    wireType: wireType ?? getTypeSpecBuiltInType(context, "string"),
    baseType: baseType,
    crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, type),
  });
}

export function getSdkArrayOrDict(
  context: TCGCContext,
  type: Model,
  operation?: Operation,
): (SdkDictionaryType | SdkArrayType) | undefined {
  return ignoreDiagnostics(getSdkArrayOrDictWithDiagnostics(context, type, operation));
}

export function getSdkArrayOrDictWithDiagnostics(
  context: TCGCContext,
  type: Model,
  operation?: Operation,
): [(SdkDictionaryType | SdkArrayType) | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  // if model with both indexer and properties or name should be a model with additional properties
  if (type.indexer !== undefined && type.properties.size === 0) {
    if (!isNeverType(type.indexer.key)) {
      let sdkType = context.__arrayDictionaryCache.get(type);
      if (!sdkType) {
        const name = type.indexer.key.name;
        if (name === "string" && type.name === "Record") {
          // model MyModel is Record<> {} should be model with additional properties
          if (type.sourceModel?.kind === "Model" && type.sourceModel?.name === "Record") {
            return diagnostics.wrap(undefined);
          } else {
            // other cases are dict
            sdkType = {
              ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "dict")),
              keyType: diagnostics.pipe(
                getClientTypeWithDiagnostics(context, type.indexer.key, operation),
              ),
              valueType: diagnostics.pipe(getUnknownType(context, type)), // set unknown for cache
            };
          }
        } else if (name === "integer") {
          // only array's index key name is integer
          sdkType = {
            ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "array")),
            name: getLibraryName(context, type),
            valueType: diagnostics.pipe(getUnknownType(context, type)), // set unknown for cache
            crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, type, operation),
          };
        } else {
          // additional properties case
          return diagnostics.wrap(undefined);
        }
        context.__arrayDictionaryCache.set(type, sdkType!);
        // Singularize the current naming context for array/dict value types
        const currentCtx = context.__namingContextPath.at(-1);
        if (currentCtx) {
          popNamingContext(context);
          pushNamingContext(
            context,
            pluralize.singular(currentCtx.name),
            type.indexer.value! as ContextNode["type"],
          );
        }
        sdkType!.valueType = diagnostics.pipe(
          getClientTypeWithDiagnostics(context, type.indexer.value!, operation),
        );
        if (currentCtx) {
          popNamingContext(context);
          pushNamingContext(context, currentCtx.name, currentCtx.type);
        }
      }
      return diagnostics.wrap(sdkType);
    }
  }
  return diagnostics.wrap(undefined);
}

export function getSdkTuple(
  context: TCGCContext,
  type: Tuple,
  operation?: Operation,
): SdkTupleType {
  return ignoreDiagnostics(getSdkTupleWithDiagnostics(context, type, operation));
}

export function getSdkTupleWithDiagnostics(
  context: TCGCContext,
  type: Tuple,
  operation?: Operation,
): [SdkTupleType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  return diagnostics.wrap({
    ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "tuple")),
    valueTypes: type.values.map((x) =>
      diagnostics.pipe(getClientTypeWithDiagnostics(context, x, operation)),
    ),
  });
}

export function getSdkUnion(context: TCGCContext, type: Union, operation?: Operation): SdkType {
  return ignoreDiagnostics(getSdkUnionWithDiagnostics(context, type, operation));
}

export function getSdkUnionWithDiagnostics(
  context: TCGCContext,
  type: Union,
  operation?: Operation,
): [SdkType, readonly Diagnostic[]] {
  let retval: SdkType | undefined = context.__referencedTypeCache.get(type);
  const diagnostics = createDiagnosticCollector();

  if (!retval) {
    const nonNullOptions = getNonNullOptions(type);
    const nullOption = getNullOption(type);

    if (nonNullOptions.length === 0) {
      // union with only `null`, report diagnostic and fall back to empty union
      diagnostics.add(createDiagnostic({ code: "union-null", target: type }));
      retval = diagnostics.pipe(getEmptyUnionType(context, type, operation));
      updateReferencedTypeMap(context, type, retval);
    } else if (checkUnionCircular(type)) {
      // union with circular ref, report diagnostic and fall back to empty union
      diagnostics.add(createDiagnostic({ code: "union-circular", target: type }));
      retval = diagnostics.pipe(getEmptyUnionType(context, type, operation));
      updateReferencedTypeMap(context, type, retval);
    } else {
      const namespace = getClientNamespace(context, type);
      // if a union is `type | null`, then we will return a nullable wrapper type of the type
      if (nonNullOptions.length === 1 && nullOption !== undefined) {
        retval = {
          ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "nullable")),
          name: getLibraryName(context, type) || getGeneratedName(context, type, operation),
          isGeneratedName: !type.name,
          crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, type),
          type: diagnostics.pipe(getUnknownType(context, type)),
          access: "public",
          usage: UsageFlags.None,
          namespace,
        };
        updateReferencedTypeMap(context, type, retval);
        retval.type = diagnostics.pipe(
          getClientTypeWithDiagnostics(context, nonNullOptions[0], operation),
        );
      } else if (
        // judge if the union can be converted to enum
        // if language does not need flatten union as enum
        // filter the case that union is composed of union or enum
        context.flattenUnionAsEnum ||
        ![...type.variants.values()].some((variant) => {
          return variant.type.kind === "Union" || variant.type.kind === "Enum";
        })
      ) {
        const unionAsEnum = diagnostics.pipe(getUnionAsEnum(type));
        if (unionAsEnum) {
          // union as enum case
          retval = diagnostics.pipe(
            getSdkUnionEnumWithDiagnostics(context, unionAsEnum, operation),
          );
          if (nullOption !== undefined) {
            retval = {
              ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "nullable")),
              name: getLibraryName(context, type) || getGeneratedName(context, type, operation),
              isGeneratedName: !type.name,
              crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, type),
              type: retval,
              access: "public",
              usage: UsageFlags.None,
              namespace,
            };
          }
          updateReferencedTypeMap(context, type, retval);
        }
      }

      // other cases
      if (retval === undefined) {
        retval = {
          ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "union")),
          name: getLibraryName(context, type) || getGeneratedName(context, type, operation),
          isGeneratedName: nullOption !== undefined ? true : !type.name, // if nullable, always set inner union type as generated name
          namespace,
          variantTypes: [],
          crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, type, operation),
          access: "public",
          usage: UsageFlags.None,
        };
        const discriminatedOptions = $(context.program).union.getDiscriminatedUnion(type)?.options;
        if (discriminatedOptions) {
          const envelope = discriminatedOptions.envelope ?? "object";
          retval.discriminatedOptions = {
            envelope,
            discriminatorPropertyName: discriminatedOptions.discriminatorPropertyName ?? "kind",
            envelopePropertyName:
              envelope === "none"
                ? undefined
                : (discriminatedOptions.envelopePropertyName ?? "value"),
          };
        }
        if (nullOption !== undefined) {
          retval = {
            ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "nullable")),
            name: getLibraryName(context, type) || getGeneratedName(context, type, operation),
            isGeneratedName: !type.name,
            crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, type),
            type: retval,
            access: "public",
            usage: UsageFlags.None,
            namespace,
          };
        }
        updateReferencedTypeMap(context, type, retval);
        const variantTypes = nonNullOptions.map((x) =>
          diagnostics.pipe(getClientTypeWithDiagnostics(context, x, operation)),
        );
        if (retval.kind === "nullable" && retval.type.kind === "union") {
          retval.type.variantTypes = variantTypes;
        } else if (retval.kind === "union") {
          retval.variantTypes = variantTypes;
        }
      }
    }
  }

  return diagnostics.wrap(retval);
}

function getEmptyUnionType(
  context: TCGCContext,
  type: Union,
  operation?: Operation,
): [SdkUnionType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const namespace = getClientNamespace(context, type);

  return diagnostics.wrap({
    ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "union")),
    name: getLibraryName(context, type) || getGeneratedName(context, type, operation),
    isGeneratedName: !type.name,
    namespace,
    clientNamespace: namespace,
    variantTypes: [],
    crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, type, operation),
    access: "public",
    usage: UsageFlags.None,
  });
}
function checkUnionCircular(type: Union): boolean {
  const visited = new Set<Union>();
  const stack = [type];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) {
      return true;
    }
    visited.add(current);
    for (const variant of current.variants.values()) {
      if (variant.type.kind === "Union") {
        stack.push(variant.type);
      }
    }
  }
  return false;
}

function getSdkConstantWithDiagnostics(
  context: TCGCContext,
  type: StringLiteral | NumericLiteral | BooleanLiteral,
  operation?: Operation,
): [SdkConstantType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  switch (type.kind) {
    case "Number":
    case "String":
    case "Boolean":
      const valueType = getSdkTypeForLiteral(context, type);
      return diagnostics.wrap({
        ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "constant")),
        value: type.value,
        valueType,
        name: getGeneratedName(context, type, operation),
        isGeneratedName: true,
      });
  }
}

export function getSdkConstant(
  context: TCGCContext,
  type: StringLiteral | NumericLiteral | BooleanLiteral,
  operation?: Operation,
): SdkConstantType {
  return ignoreDiagnostics(getSdkConstantWithDiagnostics(context, type, operation));
}

function addDiscriminatorToModelType(
  context: TCGCContext,
  type: Model,
  model: SdkModelType,
): [undefined, readonly Diagnostic[]] {
  const discriminator = getDiscriminator(context.program, type);
  const diagnostics = createDiagnosticCollector();
  if (discriminator) {
    let discriminatorType: SdkType | undefined = undefined;
    for (let i = 0; i < model.properties.length; i++) {
      const property = model.properties[i];
      if (property.kind === "property" && property.__raw?.name === discriminator.propertyName) {
        discriminatorType = property.type;
        break;
      }
    }

    let discriminatorProperty;
    for (const childModel of type.derivedModels) {
      if (isTemplateDeclaration(childModel)) continue;
      pushNamingContext(context, childModel.name ?? "", childModel);
      const childModelSdkType = diagnostics.pipe(getSdkModelWithDiagnostics(context, childModel));
      popNamingContext(context);
      for (const property of childModelSdkType.properties) {
        if (property.kind === "property") {
          if (property.__raw?.name === discriminator?.propertyName) {
            if (property.type.kind !== "constant" && property.type.kind !== "enumvalue") {
              diagnostics.add(
                createDiagnostic({
                  code: "discriminator-not-constant",
                  target: childModel,
                  format: { discriminator: property.name },
                }),
              );
            } else if (typeof property.type.value !== "string") {
              diagnostics.add(
                createDiagnostic({
                  code: "discriminator-not-string",
                  target: type,
                  format: {
                    discriminator: property.name,
                    discriminatorValue: String(property.type.value),
                  },
                }),
              );
            } else {
              // map string value type to enum value type
              if (property.type.kind === "constant" && discriminatorType?.kind === "enum") {
                for (const value of discriminatorType.values) {
                  if (value.value === property.type.value) {
                    property.type = value;
                  }
                }
              }
              childModelSdkType.discriminatorValue = property.type.value as string;
              property.discriminator = true;
              if (model.discriminatedSubtypes === undefined) {
                model.discriminatedSubtypes = {};
              }
              model.discriminatedSubtypes[property.type.value as string] = childModelSdkType;
              discriminatorProperty = property;
            }
          }
        }
      }
    }
    for (let i = 0; i < model.properties.length; i++) {
      const property = model.properties[i];
      if (property.kind === "property" && property.__raw?.name === discriminator.propertyName) {
        property.discriminator = true;
        model.discriminatorProperty = property;
        return diagnostics.wrap(undefined);
      }
    }

    if (discriminatorProperty) {
      if (discriminatorProperty.type.kind === "constant") {
        discriminatorType = { ...discriminatorProperty.type.valueType };
      } else if (discriminatorProperty.type.kind === "enumvalue") {
        discriminatorType = discriminatorProperty.type.enumType;
      }
    } else {
      discriminatorType = getTypeSpecBuiltInType(context, "string");
    }
    const name = discriminatorProperty ? discriminatorProperty.name : discriminator.propertyName;
    const discriminatorPropertyType: SdkModelPropertyType = {
      kind: "property",
      doc: `Discriminator property for ${model.name}.`,
      optional: false,
      discriminator: true,
      serializedName: discriminatorProperty
        ? discriminatorProperty.serializedName // eslint-disable-line @typescript-eslint/no-deprecated
        : discriminator.propertyName,
      serializationOptions: {},
      type: discriminatorType!,
      name,
      isGeneratedName: false,
      onClient: false,
      apiVersions: discriminatorProperty
        ? getAvailableApiVersions(context, discriminatorProperty.__raw!, type)
        : model.apiVersions,
      isApiVersionParam: false,
      isMultipartFileInput: false, // discriminator property cannot be a file
      flatten: false, // discriminator properties can not be flattened
      crossLanguageDefinitionId: `${model.crossLanguageDefinitionId}.${name}`,
      decorators: [],
      access: "public",
    };
    model.properties.splice(0, 0, discriminatorPropertyType);
    model.discriminatorProperty = discriminatorPropertyType;
  }
  return diagnostics.wrap(undefined);
}

export function getSdkModel(
  context: TCGCContext,
  type: Model,
  operation?: Operation,
): SdkModelType {
  return ignoreDiagnostics(getSdkModelWithDiagnostics(context, type, operation));
}

export function getSdkModelWithDiagnostics(
  context: TCGCContext,
  type: Model,
  operation?: Operation,
): [SdkModelType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  let sdkType = context.__referencedTypeCache.get(type) as SdkModelType | undefined;

  if (!sdkType) {
    const name = getLibraryName(context, type) || getGeneratedName(context, type, operation);
    sdkType = {
      ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "model")),
      name: name,
      isGeneratedName: !type.name,
      namespace: getClientNamespace(context, type),
      properties: [],
      additionalProperties: undefined, // going to set additional properties in the next few lines when we look at base model
      access: "public",
      usage: UsageFlags.None,
      crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, type, operation),
      apiVersions: getAvailableApiVersions(context, type, type.namespace),
      serializationOptions: {},
    };
    updateReferencedTypeMap(context, type, sdkType);

    // model MyModel is Record<> {} should be model with additional properties
    if (type.sourceModel?.kind === "Model" && type.sourceModel?.name === "Record") {
      pushNamingContext(
        context,
        "AdditionalProperty",
        type.sourceModel!.indexer!.value! as ContextNode["type"],
      );
      sdkType.additionalProperties = diagnostics.pipe(
        getClientTypeWithDiagnostics(context, type.sourceModel!.indexer!.value!, operation),
      );
      popNamingContext(context);
    }
    // model MyModel { ...Record<>} should be model with additional properties
    if (type.indexer) {
      pushNamingContext(context, "AdditionalProperty", type.indexer.value as ContextNode["type"]);
      sdkType.additionalProperties = diagnostics.pipe(
        getClientTypeWithDiagnostics(context, type.indexer.value, operation),
      );
      popNamingContext(context);
    }

    // properties should be generated first since base model's discriminator handling is depend on derived model's properties
    if (operation) {
      const requestBody = getHttpOperationWithCache(context, operation).parameters.body;
      const multipartResponseBodies = getHttpOperationWithCache(context, operation)
        .responses.map((response) => response.responses.map((r) => r.body))
        .flatMap((x) => x)
        .filter((x) => x?.bodyKind === "multipart");
      if (
        requestBody &&
        requestBody.bodyKind === "multipart" &&
        getHttpBodyType(requestBody) === type
      ) {
        // handle multipart request body model properties
        diagnostics.pipe(
          addMultipartPropertiesToModelType(context, sdkType, requestBody, operation),
        );
      } else if (multipartResponseBodies.length > 0) {
        // handle multipart response body model properties
        multipartResponseBodies.map((body) =>
          getHttpBodyType(body) === type
            ? diagnostics.pipe(
                addMultipartPropertiesToModelType(context, sdkType!, body, operation),
              )
            : undefined,
        );
      } else {
        // handle normal model properties
        diagnostics.pipe(addPropertiesToModelType(context, type, sdkType, operation));
      }
    } else {
      // handle normal model properties
      diagnostics.pipe(addPropertiesToModelType(context, type, sdkType, operation));
    }
    const rawBaseModel = getLegacyHierarchyBuilding(context, type) || type.baseModel;
    if (rawBaseModel) {
      sdkType.baseModel = context.__referencedTypeCache.get(rawBaseModel) as
        | SdkModelType
        | undefined;

      if (sdkType.baseModel === undefined) {
        // Use "AdditionalProperty" label for Record base models
        const baseModelLabel =
          rawBaseModel.name === "Record" ? "AdditionalProperty" : (rawBaseModel.name ?? "");
        pushNamingContext(context, baseModelLabel, rawBaseModel);
        const baseModel = diagnostics.pipe(
          getClientTypeWithDiagnostics(context, rawBaseModel, operation),
        ) as SdkDictionaryType | SdkModelType;
        popNamingContext(context);
        if (baseModel.kind === "dict") {
          // model MyModel extends Record<> {} should be model with additional properties
          sdkType.additionalProperties = baseModel.valueType;
        } else {
          sdkType.baseModel = baseModel;
        }
      }
    }
    diagnostics.pipe(addDiscriminatorToModelType(context, type, sdkType));
    updateReferencedTypeMap(context, type, sdkType);
  }
  return diagnostics.wrap(sdkType);
}

function getSdkEnumValueType(
  context: TCGCContext,
  values: (string | number | undefined)[],
): [SdkBuiltInType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  let kind: "string" | "int32" | "float32" = "string";
  for (const value of values) {
    if (typeof value === "number") {
      kind = intOrFloat(value);
      if (kind === "float32") {
        break;
      }
    } else if (typeof value === "string") {
      kind = "string";
      break;
    }
  }

  return diagnostics.wrap(getTypeSpecBuiltInType(context, kind!));
}

function getUnionAsEnumValueType(
  context: TCGCContext,
  union: Union,
): [SdkBuiltInType | undefined, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const nonNullOptions = getNonNullOptions(union);
  for (const option of nonNullOptions) {
    if (option.kind === "Union") {
      const ret = diagnostics.pipe(getUnionAsEnumValueType(context, option));
      if (ret) return diagnostics.wrap(ret);
    } else if (option.kind === "Scalar") {
      const ret = diagnostics.pipe(getClientTypeWithDiagnostics(context, option)) as SdkBuiltInType;
      return diagnostics.wrap(ret);
    }
  }

  return diagnostics.wrap(undefined);
}

export function getSdkEnumValue(
  context: TCGCContext,
  enumType: SdkEnumType,
  type: EnumMember,
): SdkEnumValueType {
  return ignoreDiagnostics(getSdkEnumValueWithDiagnostics(context, enumType, type));
}

function getSdkEnumValueWithDiagnostics(
  context: TCGCContext,
  enumType: SdkEnumType,
  type: EnumMember,
): [SdkEnumValueType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  return diagnostics.wrap({
    ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "enumvalue")),
    name: getLibraryName(context, type),
    value: type.value ?? type.name,
    enumType,
    valueType: enumType.valueType,
    crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, type),
  });
}

export function getSdkEnum(context: TCGCContext, type: Enum, operation?: Operation): SdkEnumType {
  return ignoreDiagnostics(getSdkEnumWithDiagnostics(context, type, operation));
}

function getSdkEnumWithDiagnostics(
  context: TCGCContext,
  type: Enum,
  operation?: Operation,
): [SdkEnumType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  let sdkType = context.__referencedTypeCache.get(type) as SdkEnumType | undefined;
  if (!sdkType) {
    sdkType = {
      ...diagnostics.pipe(getSdkTypeBaseHelper(context, type, "enum")),
      name: getLibraryName(context, type),
      isGeneratedName: false,
      namespace: getClientNamespace(context, type),
      valueType: diagnostics.pipe(
        getSdkEnumValueType(
          context,
          [...type.members.values()].map((v) => v.value),
        ),
      ),
      values: [],
      isFixed: true, // enums are always fixed after we switch to use union to represent extensible enum
      isFlags: false,
      usage: UsageFlags.None, // We will add usage as we loop through the operations
      access: "public", // Dummy value until we update models map
      crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, type, operation),
      apiVersions: getAvailableApiVersions(context, type, type.namespace),
      isUnionAsEnum: false,
    };
    for (const member of type.members.values()) {
      sdkType.values.push(
        diagnostics.pipe(getSdkEnumValueWithDiagnostics(context, sdkType, member)),
      );
    }
  }
  updateReferencedTypeMap(context, type, sdkType);

  return diagnostics.wrap(sdkType);
}

function getSdkUnionEnumValues(
  context: TCGCContext,
  type: UnionEnum,
  enumType: SdkEnumType,
): [SdkEnumValueType[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const values: SdkEnumValueType[] = [];
  for (const member of type.flattenedMembers.values()) {
    const name = getLibraryName(context, member.type);
    values.push({
      ...diagnostics.pipe(getSdkTypeBaseHelper(context, member.type, "enumvalue")),
      name: name ? name : `${member.value}`,
      value: member.value,
      valueType: enumType.valueType,
      enumType,
      crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, member.type),
    });
  }
  return diagnostics.wrap(values);
}

export function getSdkUnionEnum(context: TCGCContext, type: UnionEnum, operation?: Operation) {
  return ignoreDiagnostics(getSdkUnionEnumWithDiagnostics(context, type, operation));
}

export function getSdkUnionEnumWithDiagnostics(
  context: TCGCContext,
  type: UnionEnum,
  operation?: Operation,
): [SdkEnumType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const union = type.union;
  const name = getLibraryName(context, type.union) || getGeneratedName(context, union, operation);
  const sdkType: SdkEnumType = {
    ...diagnostics.pipe(getSdkTypeBaseHelper(context, type.union, "enum")),
    name,
    isGeneratedName: !type.union.name,
    namespace: getClientNamespace(context, type.union),
    valueType:
      diagnostics.pipe(getUnionAsEnumValueType(context, type.union)) ??
      diagnostics.pipe(
        getSdkEnumValueType(
          context,
          [...type.flattenedMembers.values()].map((v) => v.value),
        ),
      ),
    values: [],
    isFixed: !type.open,
    isFlags: false,
    usage: UsageFlags.None, // We will add usage as we loop through the operations
    access: "public", // Dummy value until we update models map
    crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, union, operation),
    apiVersions: getAvailableApiVersions(context, type.union, type.union.namespace),
    isUnionAsEnum: true,
  };
  sdkType.values = diagnostics.pipe(getSdkUnionEnumValues(context, type, sdkType));
  return diagnostics.wrap(sdkType);
}

export function getClientTypeWithDiagnostics(
  context: TCGCContext,
  type: Type,
  operation?: Operation,
): [SdkType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  let retval: SdkType | undefined;
  switch (type.kind) {
    case "String":
    case "Number":
    case "Boolean":
      retval = diagnostics.pipe(getSdkConstantWithDiagnostics(context, type));
      break;
    case "Tuple":
      retval = diagnostics.pipe(getSdkTupleWithDiagnostics(context, type, operation));
      break;
    case "Model":
      const modelAlternateType = getSdkTypeFromAlternateType(context, type, operation);
      if (modelAlternateType) {
        retval = modelAlternateType;
        break;
      }
      retval = diagnostics.pipe(getSdkArrayOrDictWithDiagnostics(context, type, operation));
      if (retval === undefined) {
        retval = diagnostics.pipe(getSdkModelWithDiagnostics(context, type, operation));
      }
      break;
    case "Intrinsic":
      retval = getSdkTypeForIntrinsic(context, type);
      break;
    case "Scalar":
      const scalarAlternateType = getAlternateType(context, type);
      retval = diagnostics.pipe(
        getSdkDateTimeOrDurationOrBuiltInType(
          context,
          scalarAlternateType && scalarAlternateType.kind === "Scalar" ? scalarAlternateType : type,
        ),
      );
      break;
    case "Enum":
      const enumAlternateType = getSdkTypeFromAlternateType(context, type, operation);
      if (enumAlternateType) {
        retval = enumAlternateType;
        break;
      }
      retval = diagnostics.pipe(getSdkEnumWithDiagnostics(context, type, operation));
      break;
    case "Union":
      const unionAlternateType = getSdkTypeFromAlternateType(context, type, operation);
      if (unionAlternateType) {
        retval = unionAlternateType;
        break;
      }
      retval = diagnostics.pipe(getSdkUnionWithDiagnostics(context, type, operation));
      break;
    case "ModelProperty":
      const alternateType = getSdkTypeFromAlternateType(context, type, operation);
      retval =
        alternateType ||
        diagnostics.pipe(getClientTypeWithDiagnostics(context, type.type, operation));
      addEncodeInfo(context, type, retval);
      break;
    case "UnionVariant":
      const unionType = diagnostics.pipe(
        getClientTypeWithDiagnostics(context, type.union, operation),
      );
      if (unionType.kind === "enum") {
        retval = unionType.values.find((x) => x.name === getLibraryName(context, type))!;
      } else {
        retval = diagnostics.pipe(getClientTypeWithDiagnostics(context, type.type, operation));
      }
      break;
    case "EnumMember":
      const enumType = diagnostics.pipe(getSdkEnumWithDiagnostics(context, type.enum, operation));
      retval = diagnostics.pipe(getSdkEnumValueWithDiagnostics(context, enumType, type));
      break;
    default:
      retval = diagnostics.pipe(getUnknownType(context, type));
      diagnostics.add(
        createDiagnostic({ code: "unsupported-kind", target: type, format: { kind: type.kind } }),
      );
  }
  return diagnostics.wrap(retval);
}

export function getClientType(context: TCGCContext, type: Type, operation?: Operation): SdkType {
  return ignoreDiagnostics(getClientTypeWithDiagnostics(context, type, operation));
}

export function isReadOnly(property: SdkModelPropertyTypeBase) {
  if (
    property.visibility &&
    property.visibility.includes(Visibility.Read) &&
    property.visibility.length === 1
  ) {
    return true;
  }
  return false;
}

function getSdkVisibility(context: TCGCContext, type: ModelProperty): Visibility[] | undefined {
  const lifecycle = getLifecycleVisibilityEnum(context.program);
  const visibility = getVisibilityForClass(context.program, type, lifecycle);
  if (visibility) {
    const result: Visibility[] = [];
    if (lifecycle.members.get("Read") && visibility.has(lifecycle.members.get("Read")!)) {
      result.push(Visibility.Read);
    }
    if (lifecycle.members.get("Create") && visibility.has(lifecycle.members.get("Create")!)) {
      result.push(Visibility.Create);
    }
    if (lifecycle.members.get("Update") && visibility.has(lifecycle.members.get("Update")!)) {
      result.push(Visibility.Update);
    }
    if (lifecycle.members.get("Delete") && visibility.has(lifecycle.members.get("Delete")!)) {
      result.push(Visibility.Delete);
    }
    if (lifecycle.members.get("Query") && visibility.has(lifecycle.members.get("Query")!)) {
      result.push(Visibility.Query);
    }
    return result;
  }
  return undefined;
}

function getSdkCredentialType(
  context: TCGCContext,
  client: SdkClientType<SdkHttpOperation>,
  authentication: Authentication,
): SdkCredentialType | SdkUnionType<SdkCredentialType> {
  const credentialTypes: SdkCredentialType[] = [];
  for (const option of authentication.options) {
    for (const scheme of option.schemes) {
      credentialTypes.push({
        // Multiple services only deal with the first server config
        __raw: client.__raw.services[0],
        kind: "credential",
        scheme: scheme,
        decorators: [],
      });
    }
  }
  if (credentialTypes.length > 1) {
    // Multiple services only deal with the first server config
    const service = client.__raw.services[0];
    return {
      __raw: service,
      kind: "union",
      variantTypes: credentialTypes,
      name: createGeneratedName(context, service, "CredentialUnion"),
      isGeneratedName: true,
      namespace: client.namespace,
      clientNamespace: client.namespace,
      crossLanguageDefinitionId: `${client.crossLanguageDefinitionId}.CredentialUnion`,
      decorators: [],
      access: "public",
      usage: UsageFlags.None,
    } as SdkUnionType<SdkCredentialType>;
  }
  return credentialTypes[0];
}

export function getSdkCredentialParameter(
  context: TCGCContext,
  client: SdkClientType<SdkHttpOperation>,
): SdkCredentialParameter | undefined {
  // Multiple services only deal with the first server config
  const service = client.__raw.services[0];
  const auth = getAuthentication(context.program, service);
  if (!auth) return undefined;
  return {
    type: getSdkCredentialType(context, client, auth),
    kind: "credential",
    name: "credential",
    isGeneratedName: true,
    doc: "Credential used to authenticate requests to the service.",
    apiVersions: client.apiVersions,
    onClient: true,
    optional: false,
    isApiVersionParam: false,
    crossLanguageDefinitionId: `${client.crossLanguageDefinitionId}.credential`,
    decorators: [],
    access: "public",
    flatten: false,
  };
}

export function getSdkModelPropertyTypeBase(
  context: TCGCContext,
  type: ModelProperty,
  operation?: Operation,
): [SdkModelPropertyTypeBase, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  // get api version info so we can cache info about its api versions before we get to property type level
  const apiVersions = getAvailableApiVersions(context, type, operation || type.model);
  const propertyType =
    getSdkTypeFromAlternateType(context, type, operation) ||
    diagnostics.pipe(getClientTypeWithDiagnostics(context, type.type, operation));
  diagnostics.pipe(addEncodeInfo(context, type, propertyType));
  const name = getPropertyNames(context, type)[0];
  const onClient = isOnClient(context, type, operation, apiVersions.length > 0);
  let encode: ArrayKnownEncoding | undefined = undefined;

  const encodeData = getEncode(context.program, type);
  // We only support array encoding at property level for now
  if (encodeData?.encoding === "ArrayEncoding.pipeDelimited") {
    encode = "pipeDelimited";
  } else if (encodeData?.encoding === "ArrayEncoding.spaceDelimited") {
    encode = "spaceDelimited";
  } else if (encodeData?.encoding === "ArrayEncoding.commaDelimited") {
    encode = "commaDelimited";
  } else if (encodeData?.encoding === "ArrayEncoding.newlineDelimited") {
    encode = "newlineDelimited";
  }
  const clientDefaultValue = getClientDefaultValue(context, type);
  return diagnostics.wrap({
    __raw: type,
    doc: getClientDoc(context, type),
    summary: getSummary(context.program, type),
    apiVersions,
    type: propertyType,
    name,
    isGeneratedName: false,
    optional: type.optional,
    ...updateWithApiVersionInformation(
      context,
      type,
      operation ? context.getClientForOperation(operation) : undefined,
      operation,
    ),
    onClient,
    crossLanguageDefinitionId: getCrossLanguageDefinitionId(context, type, operation),
    decorators: diagnostics.pipe(getTypeDecorators(context, type)),
    visibility: getSdkVisibility(context, type),
    access: getAccess(context, type),
    flatten: shouldFlattenProperty(context, type),
    encode,
    ...(clientDefaultValue !== undefined && { clientDefaultValue }),
  });
}

function isFilePart(context: TCGCContext, type: SdkType): boolean {
  if (type.kind === "array") {
    // HttpFile<T>[] or HttpPart<{@body body: bytes}>[]
    return isFilePart(context, type.valueType);
  } else if (type.kind === "bytes") {
    // Http<bytes> or HttpPart<{@body body: bytes}>
    return true;
  } else if (type.kind === "model") {
    if (type.__raw && isOrExtendsHttpFile(context.program, type.__raw)) {
      // Http<File> or HttpPart<{@body body: File}>
      return true;
    }
  }
  return false;
}

export function getSdkModelPropertyType(
  context: TCGCContext,
  type: ModelProperty,
  operation?: Operation,
): [SdkModelPropertyType, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();

  let property = context.__modelPropertyCache?.get(type);

  if (!property) {
    property = {
      ...diagnostics.pipe(getSdkModelPropertyTypeBase(context, type, operation)),
      kind: "property",
      optional: type.optional,
      discriminator: false,
      serializedName: getPropertyNames(context, type)[1],
      isMultipartFileInput: false,
      serializationOptions: {},
    };
    context.__modelPropertyCache.set(type, property);
  }
  return diagnostics.wrap(property);
}

function addPropertiesToModelType(
  context: TCGCContext,
  type: Model,
  sdkType: SdkModelType,
  operation?: Operation,
): [void, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  for (const property of type.properties.values()) {
    if (
      isStatusCode(context.program, property) ||
      isNeverOrVoidType(property.type) ||
      hasNoneVisibility(context, property) ||
      !isInScope(context, property)
    ) {
      continue;
    }
    // For naming context, pass undefined for named unions so that anonymous types
    // inside the union get named relative to the property (e.g., "TestModelProp")
    // rather than relative to the union (e.g., "TestNullable1").
    // For models, we still want to pass the type so nested anonymous types
    // get named relative to the intermediate model (e.g., "BP2ForB").
    const propType = property.type;
    const contextType =
      propType.kind === "Union" && propType.name ? undefined : (propType as ContextNode["type"]);
    pushNamingContext(context, property.name, contextType);
    const clientProperty = diagnostics.pipe(getSdkModelPropertyType(context, property, operation));
    popNamingContext(context);
    sdkType.properties.push(clientProperty);
  }
  return diagnostics.wrap(undefined);
}

function addMultipartPropertiesToModelType(
  context: TCGCContext,
  sdkType: SdkModelType,
  body: HttpOperationMultipartBody,
  operation: Operation,
): [void, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  for (const part of body.parts) {
    // skip properties that are out of scope
    if (!isInScope(context, part.property!)) {
      continue;
    }
    const clientProperty = diagnostics.pipe(
      getSdkModelPropertyType(context, part.property!, operation),
    );

    // set the type of the client property based on the part body type
    const bodyType = getHttpBodyType(part.body);
    // Push naming context for the part so nested types get proper names
    pushNamingContext(context, pascalCase(part.name!), bodyType as ContextNode["type"]);
    if (clientProperty.type.kind === "array") {
      clientProperty.type.valueType = diagnostics.pipe(
        getClientTypeWithDiagnostics(context, bodyType, operation),
      );
    } else {
      clientProperty.type = diagnostics.pipe(
        getClientTypeWithDiagnostics(context, bodyType, operation),
      );
    }
    popNamingContext(context);

    // re-apply encoding with the part's default content type so that e.g. bytes
    // in multipart/form-data gets encode "bytes" instead of the default "base64"
    const partDefaultContentType =
      part.body.contentTypes.length > 0 ? part.body.contentTypes[0] : undefined;
    const typeToEncode =
      clientProperty.type.kind === "array" ? clientProperty.type.valueType : clientProperty.type;
    diagnostics.pipe(addEncodeInfo(context, part.property!, typeToEncode, partDefaultContentType));

    clientProperty.serializationOptions.multipart = {
      isFilePart: isFilePart(context, clientProperty.type),
      isMulti: part.multi,
      filename: part.filename
        ? diagnostics.pipe(getSdkModelPropertyType(context, part.filename, operation))
        : undefined,
      contentType: part.body.contentTypeProperty
        ? diagnostics.pipe(
            getSdkModelPropertyType(context, part.body.contentTypeProperty, operation),
          )
        : undefined,
      defaultContentTypes: part.body.contentTypes,
      name: part.name!,
      headers: part.headers.map((header) => {
        return diagnostics.pipe(
          getSdkHttpParameter(context, header.property),
        ) as SdkHeaderParameter;
      }),
    };

    clientProperty.serializedName = clientProperty.serializationOptions.multipart.name; // eslint-disable-line @typescript-eslint/no-deprecated
    clientProperty.isMultipartFileInput = clientProperty.serializationOptions.multipart.isFilePart; // eslint-disable-line @typescript-eslint/no-deprecated
    clientProperty.multipartOptions = clientProperty.serializationOptions.multipart; // eslint-disable-line @typescript-eslint/no-deprecated

    sdkType.properties.push(clientProperty);
  }
  return diagnostics.wrap(undefined);
}

function updateReferencedTypeMap(context: TCGCContext, type: Type, sdkType: SdkType) {
  if (
    sdkType.kind !== "model" &&
    sdkType.kind !== "enum" &&
    sdkType.kind !== "union" &&
    sdkType.kind !== "nullable"
  ) {
    return;
  }
  context.__referencedTypeCache!.set(type, sdkType);
}

interface PropagationOptions {
  seenTypes?: Set<SdkType>;
  propagation?: boolean;
  skipFirst?: boolean;
  // this is used to prevent propagation usage from subtype to base type's other subtypes
  ignoreSubTypeStack?: boolean[];
  isOverride?: boolean;
}

export function updateUsageOrAccess(
  context: TCGCContext,
  value: UsageFlags | AccessFlags,
  type?: SdkType,
  options?: PropagationOptions,
): [void, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  options = options ?? {};
  options.seenTypes = options.seenTypes ?? new Set<SdkType>();
  options.propagation = options?.propagation ?? true;
  options.ignoreSubTypeStack = options.ignoreSubTypeStack ?? [];

  if (!type) return diagnostics.wrap(undefined);
  if (options.seenTypes.has(type)) {
    options.skipFirst = false;
    return diagnostics.wrap(undefined); // avoid circular references
  }

  if (type.kind === "array" || type.kind === "dict") {
    diagnostics.pipe(updateUsageOrAccess(context, value, type.valueType, options));
    return diagnostics.wrap(undefined);
  }
  if (type.kind === "enumvalue") {
    diagnostics.pipe(updateUsageOrAccess(context, value, type.enumType, options));
    return diagnostics.wrap(undefined);
  }

  if (
    type.kind !== "model" &&
    type.kind !== "enum" &&
    type.kind !== "union" &&
    type.kind !== "nullable"
  ) {
    return diagnostics.wrap(undefined);
  }

  // For external types, only allow External usage flag to be set and propagated.
  // All other usage (Input/Output/Json) and access propagation are blocked.
  if (type.external && value !== UsageFlags.External) {
    return diagnostics.wrap(undefined);
  }

  if (options.ignoreSubTypeStack.length === 0 || !options.ignoreSubTypeStack.at(-1)) {
    options.seenTypes.add(type);
  }

  if (!options.skipFirst) {
    if (typeof value === "number") {
      // usage set is always additive
      type.usage |= value;
    } else {
      // access set
      if (options.isOverride) {
        // when a type has access set to public, it could not be override to internal
        if (value === "internal" && type.access === "public" && type.__accessSet) {
          diagnostics.add(
            createDiagnostic({
              code: "conflict-access-override",
              target: type.__raw!,
            }),
          );
        } else {
          type.access = value;
        }
      } else {
        if (!type.__accessSet || type.access !== "public") {
          type.access = value;
        }
      }
      type.__accessSet = true;
    }
  } else {
    options.skipFirst = false;
    if (typeof value !== "number") {
      type.__accessSet = true;
    }
  }

  if (type.kind === "enum") return diagnostics.wrap(undefined);
  if (type.kind === "union") {
    for (const unionType of type.variantTypes) {
      diagnostics.pipe(updateUsageOrAccess(context, value, unionType, options));
    }
    return diagnostics.wrap(undefined);
  }
  if (type.kind === "nullable") {
    diagnostics.pipe(updateUsageOrAccess(context, value, type.type, options));
    return diagnostics.wrap(undefined);
  }

  if (!options.propagation) return diagnostics.wrap(undefined);
  if (type.baseModel) {
    options.ignoreSubTypeStack.push(true);
    if (
      context.disableUsageAccessPropagationToBase &&
      type.baseModel.discriminatorProperty === undefined // For models with discriminators, we should not disable propagation
    ) {
      options.skipFirst = true;
    }
    diagnostics.pipe(updateUsageOrAccess(context, value, type.baseModel, options));
    options.ignoreSubTypeStack.pop();
  }
  if (
    type.discriminatedSubtypes &&
    (options.ignoreSubTypeStack.length === 0 || !options.ignoreSubTypeStack.at(-1))
  ) {
    for (const discriminatedSubtype of Object.values(type.discriminatedSubtypes)) {
      options.ignoreSubTypeStack.push(false);
      diagnostics.pipe(updateUsageOrAccess(context, value, discriminatedSubtype, options));
      options.ignoreSubTypeStack.pop();
    }
  }
  if (type.additionalProperties) {
    options.ignoreSubTypeStack.push(false);
    diagnostics.pipe(updateUsageOrAccess(context, value, type.additionalProperties, options));
    options.ignoreSubTypeStack.pop();
  }
  for (const property of type.properties) {
    options.ignoreSubTypeStack.push(false);
    if (typeof value === "number") {
      let effectiveValue = value;
      // Strip Input flag for readonly properties - readonly properties only appear in output
      if (property.kind === "property" && isReadOnly(property)) {
        effectiveValue = value & ~UsageFlags.Input;
        if (effectiveValue === 0) {
          options.ignoreSubTypeStack.pop();
          continue;
        }
      }
      diagnostics.pipe(updateUsageOrAccess(context, effectiveValue, property.type, options));
    } else {
      // by default, we set property access value to parent. If there's an override though, we override.
      let propertyAccess = value;
      if (property.__raw) {
        const propertyAccessOverride = getAccessOverride(context, property.__raw);
        if (propertyAccessOverride) {
          propertyAccess = propertyAccessOverride;
        }
      }
      diagnostics.pipe(updateUsageOrAccess(context, propertyAccess, property.type, options));
    }
    options.ignoreSubTypeStack.pop();
  }
  return diagnostics.wrap(undefined);
}

function updateTypesFromOperation(
  context: TCGCContext,
  operation: Operation,
): [void, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const program = context.program;
  const httpOperation = getHttpOperationWithCache(context, operation);
  const generateConvenient = shouldGenerateConvenient(context, operation);
  const overriddenClientMethod = getOverriddenClientMethod(context, operation);

  // Push operation as naming root
  pushNamingContext(context, operation.name, operation);
  try {
    for (const param of httpOperation.parameters.parameters) {
      if (isNeverOrVoidType(param.param.type)) continue;
      // skip parameters that are out of scope
      if (!isInScope(context, param.param)) continue;
      pushNamingContext(
        context,
        `Request${pascalCase(param.name)}`,
        param.param.type as ContextNode["type"],
      );
      const sdkType = diagnostics.pipe(
        getClientTypeWithDiagnostics(context, param.param, operation),
      );
      popNamingContext(context);
      // Always update input usage for HTTP operation parameters (header, query, path)
      // even when generateConvenient is false, so that types like enums are included
      diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Input, sdkType));
      const access = getAccessOverride(context, operation) ?? "public";
      diagnostics.pipe(updateUsageOrAccess(context, access, sdkType));
    }
    const httpBody = httpOperation.parameters.body;
    if (httpBody && !isNeverOrVoidType(httpBody.type)) {
      const spread = isHttpBodySpread(httpBody);
      // If the body has a property (from @body decorator), use it to check for alternateType
      // Otherwise use the body type directly
      const bodyTypeOrProperty = httpBody.property ?? getHttpBodyType(httpBody);
      const bodyType = getHttpBodyType(httpBody);
      // For named unions, pass undefined so anonymous types inside get named relative
      // to the operation (e.g., "PostRequest") rather than the union (e.g., "A1")
      const bodyContextType =
        bodyType.kind === "Union" && bodyType.name ? undefined : (bodyType as ContextNode["type"]);
      pushNamingContext(context, "Request", bodyContextType);
      const sdkType = diagnostics.pipe(
        getClientTypeWithDiagnostics(context, bodyTypeOrProperty, operation),
      );
      popNamingContext(context);

      const multipartRequest = httpBody.bodyKind === "multipart";
      if (generateConvenient) {
        if (spread && sdkType.kind === "model") {
          updateUsageOrAccess(context, UsageFlags.Spread, sdkType, { propagation: false });
          updateUsageOrAccess(context, UsageFlags.Input, sdkType, { skipFirst: true });
        } else {
          updateUsageOrAccess(context, UsageFlags.Input, sdkType);
        }
        if (httpBody.contentTypes.some((x) => isMediaTypeJson(x))) {
          diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Json, sdkType));
        }
        if (httpBody.contentTypes.some((x) => isMediaTypeXml(x))) {
          diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Xml, sdkType));
        }
        if (httpBody.contentTypes.includes("application/merge-patch+json")) {
          // will also have Json type
          diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.JsonMergePatch, sdkType));
        }
        if (multipartRequest) {
          diagnostics.pipe(
            updateUsageOrAccess(context, UsageFlags.MultipartFormData, sdkType, {
              propagation: false,
            }),
          );
        }

        // add serialization options to model type
        updateSerializationOptions(context, sdkType, httpBody.contentTypes, undefined, httpBody);

        // after completion of usage calculation for httpBody, check whether it has
        // conflicting usage between multipart and regular body
        if (sdkType.kind === "model") {
          const isUsedInMultipart = (sdkType.usage & UsageFlags.MultipartFormData) > 0;
          const isUsedInOthers =
            ((sdkType.usage & UsageFlags.Json) | (sdkType.usage & UsageFlags.Xml)) > 0;
          if ((!multipartRequest && isUsedInMultipart) || (multipartRequest && isUsedInOthers)) {
            // This means we have a model that is used both for formdata input and for regular body input
            diagnostics.add(
              createDiagnostic({
                code: "conflicting-multipart-model-usage",
                target: httpBody.type,
                format: {
                  modelName: sdkType.name,
                },
              }),
            );
          }
        }
      }
      const access = getAccessOverride(context, operation) ?? "public";
      diagnostics.pipe(updateUsageOrAccess(context, access, sdkType));
    }
    // register the streamed payload type for stream request bodies (handles spread streams)
    const requestStreamMeta = getStreamMetadata(program, httpOperation.parameters);
    if (requestStreamMeta && generateConvenient) {
      const sdkStreamType = diagnostics.pipe(
        getClientTypeWithDiagnostics(context, requestStreamMeta.streamType, operation),
      );
      diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Input, sdkStreamType));
      if (requestStreamMeta.contentTypes.some((x) => isMediaTypeJson(x))) {
        diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Json, sdkStreamType));
      }
      const access = getAccessOverride(context, operation) ?? "public";
      diagnostics.pipe(updateUsageOrAccess(context, access, sdkStreamType));
    }

    // Push "Parameter" context for operation parameters
    const paramsModel = (overriddenClientMethod ?? operation).parameters;
    pushNamingContext(context, "Parameter", paramsModel);
    for (const param of paramsModel.properties.values()) {
      if (isNeverOrVoidType(param.type)) continue;
      // if it is a body model, skip
      if (httpOperation.parameters.body?.property === param) continue;
      // skip parameters that are out of scope
      if (!isInScope(context, param)) continue;
      // if it is a stream model, skip the wrapper but register the streamed payload type
      if (param.type.kind === "Model" && isStream(program, param.type)) {
        const streamOf = getStreamOf(program, param.type);
        if (streamOf && generateConvenient) {
          const sdkStreamType = diagnostics.pipe(
            getClientTypeWithDiagnostics(context, streamOf, operation),
          );
          diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Input, sdkStreamType));
          const paramStreamMeta = getStreamMetadata(program, httpOperation.parameters);
          if (paramStreamMeta?.contentTypes.some((x) => isMediaTypeJson(x))) {
            diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Json, sdkStreamType));
          }
          const access = getAccessOverride(context, operation) ?? "public";
          diagnostics.pipe(updateUsageOrAccess(context, access, sdkStreamType));
        }
        continue;
      }
      pushNamingContext(context, param.name, param.type as ContextNode["type"]);
      const sdkType = diagnostics.pipe(getClientTypeWithDiagnostics(context, param, operation));
      popNamingContext(context);
      if (generateConvenient) {
        diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Input, sdkType));
      }
      const access = getAccessOverride(context, operation) ?? "public";
      diagnostics.pipe(updateUsageOrAccess(context, access, sdkType));
    }
    popNamingContext(context);

    for (const response of httpOperation.responses) {
      for (const innerResponse of response.responses) {
        // Process headers BEFORE body so header types get cached with header naming context first.
        // This ensures anonymous types in headers use the operation-based path (e.g., "TestResponseRepeatabilityResult")
        // rather than the model-property path (e.g., "ResponseWithAnonymousUnionRepeatabilityResult")
        const headers = getHttpOperationResponseHeaders(innerResponse);
        if (headers) {
          for (const header of Object.values(headers)) {
            if (isNeverOrVoidType(header.type)) continue;
            pushNamingContext(
              context,
              `Response${pascalCase(header.name)}`,
              header.type as ContextNode["type"],
            );
            const sdkType = diagnostics.pipe(
              getClientTypeWithDiagnostics(context, header.type, operation),
            );
            popNamingContext(context);
            if (generateConvenient) {
              diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Output, sdkType));
            }
            const access = getAccessOverride(context, operation) ?? "public";
            diagnostics.pipe(updateUsageOrAccess(context, access, sdkType));
          }
        }
        // Process body AFTER headers
        if (innerResponse.body?.type && !isNeverOrVoidType(innerResponse.body.type)) {
          const body =
            innerResponse.body.type.kind === "Model"
              ? getEffectivePayloadType(context, innerResponse.body.type, Visibility.Read)
              : innerResponse.body.type;
          // For named unions, pass undefined so anonymous types inside get named relative
          // to the operation rather than the union
          const bodyContextType =
            body.kind === "Union" && body.name ? undefined : (body as ContextNode["type"]);
          pushNamingContext(context, "Response", bodyContextType);
          const sdkType = diagnostics.pipe(getClientTypeWithDiagnostics(context, body, operation));
          popNamingContext(context);
          if (generateConvenient) {
            if (response.statusCodes === "*" || isErrorModel(context.program, body)) {
              diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Exception, sdkType));
            } else {
              diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Output, sdkType));
            }

            if (innerResponse.body.contentTypes.some((x) => isMediaTypeJson(x))) {
              diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Json, sdkType));
            }

            if (innerResponse.body.contentTypes.some((x) => isMediaTypeXml(x))) {
              diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Xml, sdkType));
            }

            if (innerResponse.body.bodyKind === "multipart") {
              diagnostics.pipe(
                updateUsageOrAccess(context, UsageFlags.MultipartFormData, sdkType, {
                  propagation: false,
                }),
              );
            }

            // add serialization options to model type
            updateSerializationOptions(
              context,
              sdkType,
              innerResponse.body.contentTypes,
              undefined,
              innerResponse.body,
            );
          }
          const access = getAccessOverride(context, operation) ?? "public";
          diagnostics.pipe(updateUsageOrAccess(context, access, sdkType));
        }
        // register the streamed payload type for stream responses
        const responseStreamMeta = getStreamMetadata(program, innerResponse);
        if (responseStreamMeta && generateConvenient) {
          const sdkStreamType = diagnostics.pipe(
            getClientTypeWithDiagnostics(context, responseStreamMeta.streamType, operation),
          );
          diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Output, sdkStreamType));
          if (responseStreamMeta.contentTypes.some((x) => isMediaTypeJson(x))) {
            diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Json, sdkStreamType));
          }
          const access = getAccessOverride(context, operation) ?? "public";
          diagnostics.pipe(updateUsageOrAccess(context, access, sdkStreamType));
        }
      }
    }

  } finally {
    popNamingContext(context); // pop operation
  }
  return diagnostics.wrap(undefined);
}

function updateAccessOverride(context: TCGCContext): [void, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  // set access for all orphan model without override
  for (const sdkType of context.__referencedTypeCache.values()) {
    const accessOverride = getAccessOverride(context, sdkType.__raw as any);
    if (!sdkType.__accessSet && accessOverride === undefined) {
      diagnostics.pipe(updateUsageOrAccess(context, "public", sdkType));
    }
  }
  for (const sdkType of context.__referencedTypeCache.values()) {
    const accessOverride = getAccessOverride(context, sdkType.__raw as any);
    if (accessOverride) {
      diagnostics.pipe(updateUsageOrAccess(context, accessOverride, sdkType, { isOverride: true }));
    }
  }
  return diagnostics.wrap(undefined);
}

function updateUsageOverride(context: TCGCContext): [void, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  for (const sdkType of context.__referencedTypeCache.values()) {
    const usageOverride = getUsageOverride(context, sdkType.__raw as any);
    if (usageOverride) {
      diagnostics.pipe(updateUsageOrAccess(context, usageOverride, sdkType, { isOverride: true }));
      if (usageOverride & UsageFlags.Json) {
        // if a type has Json usage, then it should have serialization options
        updateSerializationOptions(context, sdkType, ["application/json"]);
      }
      if (usageOverride & UsageFlags.Xml) {
        // if a type has Xml usage, then it should have serialization options
        updateSerializationOptions(context, sdkType, ["application/xml"]);
      }
    }
  }
  return diagnostics.wrap(undefined);
}

function updateSpreadModelUsageAndAccess(context: TCGCContext): void {
  for (const [_, sdkType] of context.__referencedTypeCache.entries()) {
    if (
      sdkType.kind === "model" &&
      (sdkType.usage & UsageFlags.Spread) > 0 &&
      (sdkType.usage & (UsageFlags.Input | UsageFlags.Output)) === 0
    ) {
      // if a type has spread usage, but not used in any other operation, then set it to be internal
      sdkType.access = "internal";
    }
  }
}

function updateExternalUsage(context: TCGCContext): void {
  // Propagate External usage flag from external types to their referenced types
  for (const [_, sdkType] of context.__referencedTypeCache.entries()) {
    if (
      sdkType.external &&
      (sdkType.kind === "model" || sdkType.kind === "enum" || sdkType.kind === "union")
    ) {
      // Propagate External usage to the external type itself and all referenced types
      updateUsageOrAccess(context, UsageFlags.External, sdkType);
    }
  }
}

/**
 * Helper function to check if a type has input or output usage
 */
function hasInputOrOutputUsage(usage: number): boolean {
  return (usage & (UsageFlags.Input | UsageFlags.Output)) !== 0;
}

/**
 * Clean up discriminator info when discriminated subtypes are missing usage.
 * Remove subtypes without usage from the discriminatedSubtypes map to prevent
 * language emitters from referencing unavailable types.
 */
function cleanupDiscriminatorForUnusedBase(context: TCGCContext): void {
  for (const sdkType of context.__referencedTypeCache.values()) {
    if (sdkType.kind !== "model" || !sdkType.discriminatedSubtypes) continue;

    // Remove discriminated subtypes that have no usage
    for (const [key, subtype] of Object.entries(sdkType.discriminatedSubtypes)) {
      if (!hasInputOrOutputUsage(subtype.usage)) {
        delete sdkType.discriminatedSubtypes[key];
      }
    }

    // If all subtypes were removed, clear the discriminatedSubtypes entirely
    if (Object.keys(sdkType.discriminatedSubtypes).length === 0) {
      sdkType.discriminatedSubtypes = undefined;
      sdkType.discriminatorProperty = undefined;
    }
  }
}

function handleLegacyHierarchyBuilding(context: TCGCContext): [void, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  for (const sdkType of context.__referencedTypeCache.values()) {
    if (sdkType.kind !== "model" || !sdkType.baseModel) continue;
    // if the model has legacyHierarchyBuilding, then we should update its discriminated subtypes
    const legacyHierarchyBuilding = getLegacyHierarchyBuilding(context, sdkType.__raw as Model);

    // validate no circular references
    const visited = new Set<Model>();
    visited.add(sdkType.__raw as Model);
    let current: Model | undefined = legacyHierarchyBuilding;
    while (current) {
      if (visited.has(current)) {
        diagnostics.add(
          createDiagnostic({
            code: "legacy-hierarchy-building-circular-reference",
            target: sdkType.__raw as Model,
          }),
        );
        return diagnostics.wrap(undefined);
      }
      visited.add(current);
      const changedBase = getLegacyHierarchyBuilding(context, current as Model);
      if (changedBase === undefined) {
        current = current.baseModel;
      } else {
        current = changedBase;
      }
    }

    if (legacyHierarchyBuilding) {
      // Reconcile properties on the rebased model: drop duplicates that the
      // new base chain already supplies, and lift in properties contributed
      // by removed intermediate parents.
      diagnostics.pipe(reconcilePropertiesAfterRebase(context, sdkType, legacyHierarchyBuilding));
    }

    // must be done after discriminator is added
    // Populate discriminated subtypes for legacy hierarchy building
    if (legacyHierarchyBuilding && sdkType.discriminatorValue) {
      let currBaseModel: SdkModelType | undefined = sdkType.baseModel;
      while (currBaseModel) {
        if (!currBaseModel.discriminatedSubtypes) {
          currBaseModel.discriminatedSubtypes = {};
        }
        currBaseModel.discriminatedSubtypes[sdkType.discriminatorValue] = sdkType;
        currBaseModel.discriminatorProperty = currBaseModel.properties.find((p) => p.discriminator);
        currBaseModel = currBaseModel.baseModel;
      }

      // Filter out legacy hierarchy building properties
      sdkType.properties = sdkType.properties.filter((property) => {
        return (
          property.discriminator || !legacyHierarchyBuilding.properties.has(property.__raw!.name)
        );
      });
    }
  }
  return diagnostics.wrap(undefined);
}

/**
 * Reconcile properties on a rebased model after `@hierarchyBuilding(oldBase, newBase)`.
 *
 * Rule:
 *   1. Compute `oldBaseEffective` = properties already on `oldBase` (its own
 *      `properties` Map) plus properties contributed by every removed
 *      intermediate ancestor. When the same name appears more than once,
 *      the nearest contributor wins (own > nearest intermediate > farther).
 *   2. Compute `newBaseSupplied` = every property name supplied anywhere in
 *      the new base chain (newBase + its ancestors).
 *   3. For each name in `oldBaseEffective` that also appears in
 *      `newBaseSupplied`: drop it. If the types are assignable in either
 *      direction, drop silently; otherwise emit
 *      `legacy-hierarchy-building-conflict` (`property-type-mismatch`).
 *   4. Whatever remains becomes the rebased model's own SDK properties.
 *      Properties already materialized on the SDK model are preserved
 *      as-is; properties contributed only by removed intermediates are
 *      materialized via `getSdkModelPropertyType`.
 */
function reconcilePropertiesAfterRebase(
  context: TCGCContext,
  sdkType: SdkModelType,
  newBase: Model,
): [void, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const oldBase = sdkType.__raw as Model;

  const oldBaseChain = walkBaseChain(oldBase);
  const newBaseChain = walkBaseChain(newBase);
  const newBaseIndex = oldBaseChain.indexOf(newBase);
  const removed = newBaseIndex >= 0 ? oldBaseChain.slice(1, newBaseIndex) : oldBaseChain.slice(1);

  // Names supplied anywhere in the new base chain → first ModelProperty seen.
  // Apply the same SDK-shape filters as `addPropertiesToModelType` so the
  // "supplied by the new base chain" view matches what the SDK actually sees.
  const newBaseSupplied = new Map<string, ModelProperty>();
  for (const m of newBaseChain) {
    for (const [name, prop] of m.properties) {
      if (newBaseSupplied.has(name)) continue;
      if (!isVisibleSdkProperty(context, prop)) continue;
      newBaseSupplied.set(name, prop);
    }
  }

  // Effective properties on the rebased model before reconciliation: oldBase's
  // own first (they win), then nearest-removed-ancestor first.
  const oldBaseEffective = new Map<string, ModelProperty>();
  for (const [name, prop] of oldBase.properties) {
    oldBaseEffective.set(name, prop);
  }
  for (const intermediate of removed) {
    for (const [name, prop] of intermediate.properties) {
      if (!oldBaseEffective.has(name)) oldBaseEffective.set(name, prop);
    }
  }

  // Identify the discriminator property name (if any) on the rebased model —
  // it must be preserved across the rebase even when the new base supplies a
  // wider-typed property with the same name.
  const discriminatorPropName = sdkType.properties.find((p) => p.discriminator)?.__raw?.name;

  const keptProps: SdkModelPropertyType[] = [];
  const sdkPropByRawName = new Map<string, SdkModelPropertyType>();
  for (const prop of sdkType.properties) {
    if (prop.__raw?.name) sdkPropByRawName.set(prop.__raw.name, prop);
  }

  for (const [name, rawProp] of oldBaseEffective) {
    if (!isVisibleSdkProperty(context, rawProp)) {
      continue;
    }

    const fromOwn = oldBase.properties.has(name);
    const isDiscriminator = name === discriminatorPropName;
    const newBaseProp = newBaseSupplied.get(name);

    if (newBaseProp && !isDiscriminator) {
      if (areTypesIncompatible(context, rawProp.type, newBaseProp.type)) {
        diagnostics.add(
          createDiagnostic({
            code: "legacy-hierarchy-building-conflict",
            messageId: "property-type-mismatch",
            format: {
              propertyName: name,
              childModel: oldBase.name,
              parentModel: newBase.name,
            },
            target: oldBase,
          }),
        );
      }
      // Drop either way: the new base chain owns this name.
      continue;
    }

    if (fromOwn) {
      const existing = sdkPropByRawName.get(name);
      if (existing) keptProps.push(existing);
      continue;
    }

    // Lift from a removed intermediate. Mirror the contextType logic used in
    // `addPropertiesToModelType`: for named unions, pass `undefined` so any
    // anonymous variants get named relative to the property rather than
    // relative to the union.
    const propType = rawProp.type;
    const contextType =
      propType.kind === "Union" && propType.name ? undefined : (propType as ContextNode["type"]);
    pushNamingContext(context, name, contextType);
    const lifted = diagnostics.pipe(getSdkModelPropertyType(context, rawProp));
    popNamingContext(context);
    keptProps.push(lifted);
  }

  sdkType.properties = keptProps;
  return diagnostics.wrap(undefined);
}

/**
 * Apply the same predicates as `addPropertiesToModelType` so our view of the
 * SDK-observable property set stays aligned with the actual SDK shape.
 */
function isVisibleSdkProperty(context: TCGCContext, property: ModelProperty): boolean {
  return (
    !isStatusCode(context.program, property) &&
    !isNeverOrVoidType(property.type) &&
    !hasNoneVisibility(context, property) &&
    isInScope(context, property)
  );
}

/**
 * Check if two property types are incompatible during `@hierarchyBuilding`
 * reconciliation. They are considered compatible (no diagnostic) when either
 * is assignable to the other under TypeSpec's type system.
 */
function areTypesIncompatible(context: TCGCContext, targetType: Type, newBaseType: Type): boolean {
  if (targetType === newBaseType) return false;
  const typekit = $(context.program).type;
  if (typekit.isAssignableTo(targetType, newBaseType, targetType)) return false;
  if (typekit.isAssignableTo(newBaseType, targetType, newBaseType)) return false;
  return true;
}

/**
 * Walk a model's raw inheritance chain, returning [model, model.baseModel, ...]
 * along the original (pre-rebase) parent links.
 */
function walkBaseChain(model: Model): Model[] {
  const chain: Model[] = [];
  const seen = new Set<Model>();
  let current: Model | undefined = model;
  while (current && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    current = current.baseModel;
  }
  return chain;
}

interface UsageFilteringOptions {
  input?: boolean;
  output?: boolean;
}

function handleServiceOrphanTypes(context: TCGCContext): [void, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  for (const t of listOrphanTypes(context)) {
    // skip if already processed
    if (context.__referencedTypeCache!.has(t)) {
      continue;
    }
    if (t.kind !== "Enum") {
      pushNamingContext(context, t.name ?? "", t);
    }
    const sdkType = diagnostics.pipe(getClientTypeWithDiagnostics(context, t));
    if (t.kind !== "Enum") {
      popNamingContext(context);
    }
    // add serialization options to model type
    updateSerializationOptions(context, sdkType, []);
  }
  return diagnostics.wrap(undefined);
}

function filterOutTypes(
  context: TCGCContext,
  filter: number,
): (SdkModelType | SdkEnumType | SdkUnionType | SdkNullableType)[] {
  const seen = new Set<SdkModelType | SdkEnumType | SdkUnionType | SdkNullableType>();
  const result = new Array<SdkModelType | SdkEnumType | SdkUnionType | SdkNullableType>();
  for (const sdkType of context.__referencedTypeCache.values()) {
    // filter models with unexpected usage
    if ((sdkType.usage & filter) === 0) {
      continue;
    }
    if (!seen.has(sdkType)) {
      seen.add(sdkType);
      result.push(sdkType);
    }
  }
  return result;
}

export function getAllModelsWithDiagnostics(
  context: TCGCContext,
  options: UsageFilteringOptions = {},
): [(SdkModelType | SdkEnumType)[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  return diagnostics.wrap(
    filterOutTypes(context, getFilterNumber(options)).filter(
      (x) => x.kind === "model" || x.kind === "enum",
    ),
  );
}

export function getAllModels(
  context: TCGCContext,
  options: UsageFilteringOptions = {},
): (SdkModelType | SdkEnumType)[] {
  // we currently don't return diagnostics even though we keep track of them
  // when we move to the new sdk type ecosystem completely, we'll expose
  // diagnostics as a separate property on the TCGCContext
  return ignoreDiagnostics(getAllModelsWithDiagnostics(context, options));
}

function getFilterNumber(options: UsageFilteringOptions = {}): number {
  options = { input: true, output: true, ...options };
  let filter = 0;
  if (options.input && options.output) {
    filter = Number.MAX_SAFE_INTEGER;
  } else if (options.input) {
    filter += UsageFlags.Input;
  } else if (options.output) {
    filter += UsageFlags.Output;
  }
  return filter;
}

export function getAllReferencedTypes(
  context: TCGCContext,
  options: UsageFilteringOptions = {},
): (SdkModelType | SdkEnumType | SdkUnionType | SdkNullableType)[] {
  return filterOutTypes(context, getFilterNumber(options));
}

export function handleAllTypes(context: TCGCContext): [void, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const services = new Set<Namespace>();
  for (const client of listClients(context)) {
    for (const operation of listOperationsInClient(context, client)) {
      // operations on a client
      diagnostics.pipe(updateTypesFromOperation(context, operation));
    }
    for (const sc of listSubClients(context, client, true)) {
      for (const operation of listOperationsInClient(context, sc)) {
        // operations on sub clients
        diagnostics.pipe(updateTypesFromOperation(context, operation));
      }
    }
    // server parameters
    // Multiple services only deal with the first server config
    const servers = getServers(context.program, client.services[0]);
    if (servers !== undefined && servers[0].parameters !== undefined) {
      for (const param of servers[0].parameters.values()) {
        const sdkType = diagnostics.pipe(getClientTypeWithDiagnostics(context, param));
        diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.Input, sdkType));
      }
    }
    client.services.map((s) => services.add(s));
  }
  for (const service of services) {
    // versioned enums
    const versionEnum = context.getPackageVersionEnum().get(service);
    const versions = context.getPackageVersions().get(service);
    if (versionEnum) {
      // create sdk enum for versions enum
      let sdkVersionsEnum: SdkEnumType;
      const explicitApiVersions = getExplicitClientApiVersions(context, service);
      if (explicitApiVersions) {
        // add additional api versions to the enum
        sdkVersionsEnum = diagnostics.pipe(getSdkEnumWithDiagnostics(context, explicitApiVersions));
      } else {
        sdkVersionsEnum = diagnostics.pipe(getSdkEnumWithDiagnostics(context, versionEnum));
      }
      filterPreviewVersion(context, sdkVersionsEnum, versions?.at(-1) || "");
      diagnostics.pipe(updateUsageOrAccess(context, UsageFlags.ApiVersionEnum, sdkVersionsEnum));
    }
  }
  // update for orphan models/enums/unions
  diagnostics.pipe(handleServiceOrphanTypes(context));
  // update access
  diagnostics.pipe(updateAccessOverride(context));
  // update usage
  diagnostics.pipe(updateUsageOverride(context));
  // update spread model
  updateSpreadModelUsageAndAccess(context);
  // update external usage
  updateExternalUsage(context);
  // update discriminated subtypes and filter out duplicate properties from `@hierarchyBuilding`
  diagnostics.pipe(handleLegacyHierarchyBuilding(context));
  // clean up discriminator info when only subtypes have usage
  cleanupDiscriminatorForUnusedBase(context);
  // update generated name
  resolveConflictGeneratedName(context);

  return diagnostics.wrap(undefined);
}

function updateSerializationOptions(
  context: TCGCContext,
  type: SdkType,
  contentTypes: string[],
  options?: PropagationOptions,
  httpBody?: HttpPayloadBody,
) {
  options = options ?? {};
  options.seenTypes = options.seenTypes ?? new Set<SdkType>();
  options.propagation = options?.propagation ?? true;
  options.ignoreSubTypeStack = options.ignoreSubTypeStack ?? [];

  if (options.seenTypes.has(type)) {
    return; // avoid circular references
  }

  if (type.kind === "array" || type.kind === "dict") {
    updateSerializationOptions(context, type.valueType, contentTypes, options);
    return;
  }

  if (type.kind !== "model" && type.kind !== "union" && type.kind !== "nullable") return;

  if (options.ignoreSubTypeStack.length === 0 || !options.ignoreSubTypeStack.at(-1)) {
    options.seenTypes.add(type);
  }

  if (type.kind === "union") {
    for (const unionType of type.variantTypes) {
      updateSerializationOptions(context, unionType, contentTypes, options);
    }
    return;
  }
  if (type.kind === "nullable") {
    updateSerializationOptions(context, type.type, contentTypes, options);
    return;
  }

  // Handle file body serialization - if it's a file, set binary options and skip json/xml
  if (httpBody?.bodyKind === "file") {
    const fileBody = httpBody as HttpOperationFileBody;
    type.serializationOptions.binary = {
      isFile: true,
      isText: fileBody.isText,
      contentTypes: fileBody.contentTypes,
      filename: fileBody.filename,
    };
    return; // No need to add json/xml serialization for file types
  }

  setSerializationOptions(context, type, contentTypes);

  // If the model has serialization options from explicit decorators (not from contentTypes),
  // ensure properties also get those serialization options.
  // This handles orphan models where contentTypes is empty but the model has XML/JSON decorators.
  let effectiveContentTypes = contentTypes;
  if (type.serializationOptions.xml && !contentTypes.some(isMediaTypeXml)) {
    effectiveContentTypes = [...effectiveContentTypes, "application/xml"];
  }
  if (type.serializationOptions.json && !contentTypes.some(isMediaTypeJson)) {
    effectiveContentTypes = [...effectiveContentTypes, "application/json"];
  }

  for (const property of type.properties) {
    if (property.kind === "property") {
      setSerializationOptions(context, property, effectiveContentTypes);
    }
  }

  if (type.baseModel) {
    options.ignoreSubTypeStack.push(true);
    updateSerializationOptions(context, type.baseModel, contentTypes, options);
    options.ignoreSubTypeStack.pop();
  }
  if (
    type.discriminatedSubtypes &&
    (options.ignoreSubTypeStack.length === 0 || !options.ignoreSubTypeStack.at(-1))
  ) {
    for (const discriminatedSubtype of Object.values(type.discriminatedSubtypes)) {
      options.ignoreSubTypeStack.push(false);
      updateSerializationOptions(context, discriminatedSubtype, contentTypes, options);
      options.ignoreSubTypeStack.pop();
    }
  }
  if (type.additionalProperties) {
    options.ignoreSubTypeStack.push(false);
    updateSerializationOptions(context, type.additionalProperties, contentTypes, options);
    options.ignoreSubTypeStack.pop();
  }
  for (const property of type.properties) {
    options.ignoreSubTypeStack.push(false);
    updateSerializationOptions(context, property.type, contentTypes, options);
    options.ignoreSubTypeStack.pop();
  }
  return;
}

function setSerializationOptions(
  context: TCGCContext,
  type: SdkModelType | SdkModelPropertyType,
  contentTypes: string[],
) {
  for (const contentType of contentTypes) {
    if (isMediaTypeJson(contentType) && !type.serializationOptions.json) {
      updateJsonSerializationOptions(context, type);
    }

    if (isMediaTypeXml(contentType) && !type.serializationOptions.xml) {
      updateXmlSerializationOptions(context, type);
    }
  }
  if (
    !type.serializationOptions.json &&
    type.__raw &&
    hasExplicitlyDefinedJsonSerializationInfo(context, type.__raw)
  ) {
    updateJsonSerializationOptions(context, type);
  }
  if (
    !type.serializationOptions.xml &&
    type.__raw &&
    hasExplicitlyDefinedXmlSerializationInfo(context, type.__raw)
  ) {
    updateXmlSerializationOptions(context, type);
  }
  const defaultContentTypes = type.serializationOptions.multipart?.defaultContentTypes;
  if (defaultContentTypes && type.kind === "property" && type.type.kind === "model") {
    for (const prop of type.type.properties) {
      if (prop.kind === "property") {
        setSerializationOptions(context, prop, defaultContentTypes);
      }
    }
  }
}

function updateJsonSerializationOptions(
  context: TCGCContext,
  type: SdkModelType | SdkModelPropertyType,
) {
  type.serializationOptions.json = {
    name:
      type.__raw?.kind === "Model" || type.__raw?.kind === "ModelProperty"
        ? resolveEncodedName(context.program, type.__raw, "application/json")
        : type.name,
  };
}

function updateXmlSerializationOptions(
  context: TCGCContext,
  type: SdkModelType | SdkModelPropertyType,
) {
  type.serializationOptions.xml = {
    name:
      type.__raw?.kind === "Model" || type.__raw?.kind === "ModelProperty"
        ? resolveEncodedName(context.program, type.__raw, "application/xml")
        : type.name,
    attribute: type.__raw?.kind === "ModelProperty" && isAttribute(context.program, type.__raw),
    ns: type.__raw ? getNs(context.program, type.__raw) : undefined,
    unwrapped: type.__raw?.kind === "ModelProperty" && isUnwrapped(context.program, type.__raw),
  };

  // set extra serialization info for array property
  if (
    type.__raw?.kind === "ModelProperty" &&
    type.__raw.type.kind === "Model" &&
    isArrayModelType(type.__raw.type)
  ) {
    if (!type.serializationOptions.xml.unwrapped) {
      // if wrapped, set itemsName and itemsNS according to the array item type
      const itemType = type.__raw.type.indexer.value;
      if ("name" in itemType) {
        // if the type has name then get the name
        type.serializationOptions.xml.itemsName = resolveEncodedName(
          context.program,
          itemType as Type & { name: string },
          "application/xml",
        );
        type.serializationOptions.xml.itemsNs = getNs(context.program, itemType);
      } else {
        // otherwise use the property name
        type.serializationOptions.xml.itemsName = type.serializationOptions.xml.name;
        type.serializationOptions.xml.itemsNs = type.serializationOptions.xml.ns;
      }
    } else {
      // if unwrapped, always set itemName to property name
      type.serializationOptions.xml.itemsName = type.serializationOptions.xml.name;
      type.serializationOptions.xml.itemsNs = type.serializationOptions.xml.ns;
    }
  }
}

function hasExplicitlyDefinedXmlSerializationInfo(context: TCGCContext, type: Type): boolean {
  if (type.kind === "Model" || type.kind === "ModelProperty" || type.kind === "Scalar") {
    if (type.decorators && type.decorators.some((d) => d.definition?.namespace.name === "Xml")) {
      return true;
    }
    const xmlName = resolveEncodedName(context.program, type, "application/xml");
    if (xmlName && xmlName !== type.name) {
      return true;
    }
  }
  if (type.kind === "ModelProperty" && type.type.kind === "Model" && isArrayModelType(type.type)) {
    const itemType = type.type.indexer.value;
    if (itemType && hasExplicitlyDefinedXmlSerializationInfo(context, itemType)) {
      return true;
    }
  }
  return false;
}

function hasExplicitlyDefinedJsonSerializationInfo(context: TCGCContext, type: Type): boolean {
  if (type.kind === "ModelProperty") {
    const jsonName = resolveEncodedName(context.program, type, "application/json");
    if (jsonName && jsonName !== type.name) {
      return true;
    }
  }
  return false;
}

function getSdkTypeFromAlternateType(
  context: TCGCContext,
  type: Enum | Model | ModelProperty | Scalar | Union,
  operation?: Operation,
): SdkType | undefined {
  const alternateType = getAlternateType(context, type);
  if (!alternateType || alternateType?.kind === "externalTypeInfo") {
    return undefined;
  }
  return ignoreDiagnostics(getClientTypeWithDiagnostics(context, alternateType, operation));
}
