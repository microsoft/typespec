import {
  DateTimeKnownEncoding,
  Diagnostic,
  DurationKnownEncoding,
  EmitContext,
  Enum,
  Interface,
  IntrinsicScalarName,
  Model,
  ModelProperty,
  Namespace,
  Operation,
  PagingOperation,
  Program,
  Type,
  Union,
} from "@typespec/compiler";
import { unsafe_Realm } from "@typespec/compiler/experimental";
import {
  HttpAuth,
  HttpOperation,
  HttpOperationResponse,
  HttpStatusCodeRange,
  HttpVerb,
  Visibility,
} from "@typespec/http";
import type { ContextNode } from "./internal-utils.js";

// Types for TCGC lib

type SourceKind = "RequestParameter" | "RequestBody" | "ResponseBody";

export interface TCGCContext {
  program: Program;
  diagnostics: readonly Diagnostic[];
  emitterName: string;

  generateProtocolMethods?: boolean;
  generateConvenienceMethods?: boolean;
  examplesDir?: string;
  namespaceFlag?: string;
  apiVersion?: string;
  license?: {
    name: string;
    company?: string;
    header?: string;
    link?: string;
    description?: string;
  };

  decoratorsAllowList?: string[];
  previewStringRegex: RegExp;
  disableUsageAccessPropagationToBase: boolean;
  flattenUnionAsEnum?: boolean;
  enableLegacyHierarchyBuilding?: boolean;

  __referencedTypeCache: Map<Type, SdkModelType | SdkEnumType | SdkUnionType | SdkNullableType>;
  __arrayDictionaryCache: Map<Type, SdkDictionaryType | SdkArrayType>;
  __methodParameterCache: Map<ModelProperty, SdkMethodParameter>;
  __modelPropertyCache: Map<ModelProperty, SdkModelPropertyType>;
  __responseHeaderCache: Map<ModelProperty, SdkServiceResponseHeader>;
  __generatedNames: Map<Type, string>;
  __httpOperationCache: Map<Operation, HttpOperation>;
  __tspTypeToApiVersions: Map<Type, string[]>;
  __explicitClients?: Set<SdkClient>;
  __rawClientsCache?: Map<Namespace | Interface | string, SdkClient>;
  __clientToOperationsCache?: Map<SdkClient, Operation[]>;
  __operationToClientCache?: Map<Operation, SdkClient>;
  __clientParametersCache: Map<SdkClient, SdkMethodParameter[]>;
  __clientApiVersionDefaultValueCache: Map<SdkClient, string | undefined>;
  __httpOperationExamples: Map<HttpOperation, SdkHttpOperationExample[]>;
  __pagedResultSet: Set<SdkType>;
  __namingContextPath: ContextNode[]; // Stack tracking the current traversal position for naming anonymous types.
  __orphanTypesCache?: (Model | Enum | Union)[]; // cached result of listOrphanTypes to avoid repeated namespace traversals
  __mutatedGlobalNamespace?: Namespace; // the root of all tsp namespaces for this instance. Starting point for traversal, so we don't call mutation multiple times
  __mutatedRealm?: unsafe_Realm; // the realm that contains all mutated types for this instance
  __packageVersions?: Map<Namespace, string[]>; // the package versions (for each service) from the service versioning config and api version setting in tspconfig.
  __packageVersionEnum?: Map<Namespace, Enum | undefined>; // the enum type that contains all the package versions (for each service).
  __externalPackageToVersions?: Map<string, string>;

  getMutatedGlobalNamespace(): Namespace;
  getApiVersionsForType(type: Type): string[];
  setApiVersionsForType(type: Type, apiVersions: string[]): void;
  getPackageVersions(): Map<Namespace, string[]>;
  getPackageVersionEnum(): Map<Namespace, Enum | undefined>;
  getClients(): SdkClient[];
  getRootClients(): SdkClient[];
  getClient(type: Namespace | Interface): SdkClient | undefined;
  getOperationsForClient(client: SdkClient): Operation[];
  getClientForOperation(operation: Operation): SdkClient;
}

export interface SdkContext<
  TOptions extends object = Record<string, any>,
  TServiceOperation extends SdkServiceOperation = SdkHttpOperation,
> extends TCGCContext {
  emitContext: EmitContext<TOptions>;
  sdkPackage: SdkPackage<TServiceOperation>;
}

// Types for TCGC customization decorators

export interface SdkClient {
  kind: "SdkClient";
  name: string;
  services: Namespace[];
  /** The type associated with this client. If it is created from string client location, or is a merged client, this will be undefined. */
  type?: Namespace | Interface;
  /** Sub clients of this client. */
  subClients: SdkClient[];
  /** The path of this client in the client hierarchy. For example, "MyClient.SubClient". */
  clientPath: string;
  /** The parent client. Only set for sub clients. */
  parent?: SdkClient;
  /** Whether to auto-merge service's things into current client. */
  autoMergeService?: boolean;
}

export type AccessFlags = "internal" | "public";

/**
 * This enum represents the different ways a model can be used in a method.
 */
export enum UsageFlags {
  None = 0,
  Input = 1 << 1,
  Output = 1 << 2,
  ApiVersionEnum = 1 << 3,
  /** Input and Json will also be set when JsonMergePatch is set. */
  JsonMergePatch = 1 << 4,
  /** Input will also be set when MultipartFormData is set. */
  MultipartFormData = 1 << 5,
  /** Used in spread. */
  Spread = 1 << 6,
  /** Set when type is used in conjunction with an application/json content type. */
  Json = 1 << 8,
  /** Set when type is used in conjunction with an application/xml content type. */
  Xml = 1 << 9,
  /** Set when type is used for exception output. */
  Exception = 1 << 10,
  /** Set when type is used as LRO initial response. */
  LroInitial = 1 << 11,
  /** Set when type is used as LRO polling response. */
  LroPolling = 1 << 12,
  /** Set when type is used as LRO final envelop response. */
  LroFinalEnvelope = 1 << 13,
  /** Set when type is only referenced by external types. */
  External = 1 << 14,
}

/**
 * Flags used to indicate how a client is initialized.
 *
 * - `Default` (0): No user-specific initialization setting has been specified. This is the default value for sub clients when no explicit initialization decorator is set.
 * - `Individually` (1): The client could be initialized individually.
 * - `Parent` (2): The client could be initialized by its parent client.
 * - `CustomizeCode` (4): Indicates that the client initialization should be omitted from generated code and handled manually in custom code.
 * - `Individually` and `Parent` are bit flags that can be combined using bitwise OR.
 */
export enum InitializedByFlags {
  Default = 0,
  CustomizeCode = 1 << 2,
  Individually = 1 << 0,
  Parent = 1 << 1,
}

/**
 * Options used to indicate how to initialize a client.
 * `parameters` is a model that used to .
 * `initializedBy` is a flag that indicates how the client is initialized.
 */
export interface ClientInitializationOptions {
  parameters?: Model;
  initializedBy?: InitializedByFlags;
}

// Types for TCGC specific type  graph

export interface DecoratedType {
  /**
   * Client types sourced from TypeSpec decorated types will have this generic decoratores list.
   * Only decorators in allowed list will be included in this list.
   * Language's emitter could set `additionalDecorators` in the option when `createSdkContext` to extend the allowed list.
   */
  decorators: DecoratorInfo[];
}

export interface DecoratorInfo {
  /**
   * Fully qualified name of the decorator. For example, `TypeSpec.@encode`, `TypeSpec.Xml.@attribute`.
   */
  name: string;
  /**
   * A dict of the decorator's arguments. For example, `{ encoding: "base64url" }`.
   */
  arguments: Record<string, any>;
}

/**
 * Represents a client in the package.
 */
export interface SdkClientType<
  TServiceOperation extends SdkServiceOperation,
> extends DecoratedType {
  __raw: SdkClient;
  kind: "client";
  /** Name of the client. */
  name: string;
  /** Full qualified namespace. */
  namespace: string;
  /** Document for the type. */
  doc?: string;
  /** Summary for the type. */
  summary?: string;
  /** Client initialization way. */
  clientInitialization: SdkClientInitializationType;
  /** Methods of the client. */
  methods: SdkMethod<TServiceOperation>[];
  /** API versions supported for current type. */
  apiVersions: string[];
  /** Unique ID for the current type. */
  crossLanguageDefinitionId: string;
  /** The parent client of this client. The structure follows the definition hierarchy. */
  parent?: SdkClientType<TServiceOperation>;
  /** The sub clients of this client. */
  children?: SdkClientType<TServiceOperation>[];
}

interface ExternalType {
  external?: ExternalTypeInfo;
}

export interface ExternalTypeInfo {
  kind: "externalTypeInfo";
  identity: string;
  package?: string;
  minVersion?: string;
}

interface SdkTypeBase extends DecoratedType, ExternalType {
  __raw?: Type;
  kind: string;
  /** Whether the type is deprecated. */
  deprecation?: string;
  /** Document for the type. */
  doc?: string;
  /** Summary for the type. */
  summary?: string;
  __accessSet?: boolean;
}

export type SdkType =
  | SdkBuiltInType
  | SdkDateTimeType
  | SdkDurationType
  | SdkArrayType
  | SdkTupleType
  | SdkDictionaryType
  | SdkNullableType
  | SdkEnumType
  | SdkEnumValueType
  | SdkConstantType
  | SdkUnionType
  | SdkModelType
  | SdkCredentialType
  | SdkEndpointType;

export interface SdkBuiltInType<
  TKind extends SdkBuiltInKinds = SdkBuiltInKinds,
> extends SdkTypeBase {
  kind: TKind;
  /** How to encode the type on wire. */
  encode?: string;
  /** Client name for the type. */
  name: string;
  /** Which type this type is derived from. */
  baseType?: SdkBuiltInType<TKind>;
  /** Unique ID for the current type. */
  crossLanguageDefinitionId: string;
}

type TypeEquality<T, U> = keyof T extends keyof U
  ? keyof U extends keyof T
    ? true
    : false
  : false;

// these two vars are used to validate whether our SdkBuiltInKinds are exhaustive for all possible values from typespec
// if it is not, a typescript compilation error will be thrown here.
const _: TypeEquality<Exclude<SupportedBuiltInKinds, SdkBuiltInKinds>, never> = true;
const __: TypeEquality<Exclude<SdkBuiltInKinds, SupportedBuiltInKinds>, never> = true;

type SupportedBuiltInKinds =
  | keyof typeof SdkIntKindsEnum
  | keyof typeof SdkFloatingPointKindsEnum
  | keyof typeof SdkFixedPointKindsEnum
  | keyof typeof SdkGenericBuiltInStringKindsEnum
  | keyof typeof SdkBuiltInKindsMiscellaneousEnum;

enum SdkIntKindsEnum {
  numeric = "numeric",
  integer = "integer",
  safeint = "safeint",
  int8 = "int8",
  int16 = "int16",
  int32 = "int32",
  int64 = "int64",
  uint8 = "uint8",
  uint16 = "uint16",
  uint32 = "uint32",
  uint64 = "uint64",
}

enum SdkFloatingPointKindsEnum {
  float = "float",
  float32 = "float32",
  float64 = "float64",
}

enum SdkFixedPointKindsEnum {
  decimal = "decimal",
  decimal128 = "decimal128",
}

enum SdkGenericBuiltInStringKindsEnum {
  string = "string",
  url = "url",
}

enum SdkBuiltInKindsMiscellaneousEnum {
  bytes = "bytes",
  boolean = "boolean",
  plainDate = "plainDate",
  plainTime = "plainTime",
  unknown = "unknown",
}

export type SdkBuiltInKinds = Exclude<IntrinsicScalarName, SdkBuiltInKindsExcludes> | "unknown";

type SdkBuiltInKindsExcludes = "utcDateTime" | "offsetDateTime" | "duration";

export function getKnownScalars(): Record<string, SdkBuiltInKinds> {
  const retval: Record<string, SdkBuiltInKinds> = {};
  const typespecNamespace = Object.keys(SdkBuiltInKindsMiscellaneousEnum)
    .concat(Object.keys(SdkIntKindsEnum))
    .concat(Object.keys(SdkFloatingPointKindsEnum))
    .concat(Object.keys(SdkFixedPointKindsEnum))
    .concat(Object.keys(SdkGenericBuiltInStringKindsEnum));
  for (const kind of typespecNamespace) {
    if (!isSdkBuiltInKind(kind)) continue; // it will always be true
    retval[`TypeSpec.${kind}`] = kind;
  }
  return retval;
}

export function isSdkBuiltInKind(kind: string): kind is SdkBuiltInKinds {
  return (
    kind in SdkBuiltInKindsMiscellaneousEnum ||
    isSdkIntKind(kind) ||
    isSdkFloatKind(kind) ||
    isSdkFixedPointKind(kind) ||
    kind in SdkGenericBuiltInStringKindsEnum
  );
}

export function isSdkIntKind(kind: string): kind is keyof typeof SdkIntKindsEnum {
  return kind in SdkIntKindsEnum;
}

export function isSdkFloatKind(kind: string): kind is keyof typeof SdkFloatingPointKindsEnum {
  return kind in SdkFloatingPointKindsEnum;
}

function isSdkFixedPointKind(kind: string): kind is keyof typeof SdkFixedPointKindsEnum {
  return kind in SdkFixedPointKindsEnum;
}

const SdkDateTimeEncodingsConst = ["rfc3339", "rfc7231", "unixTimestamp"] as const;

export function isSdkDateTimeEncodings(encoding: string): encoding is DateTimeKnownEncoding {
  return SdkDateTimeEncodingsConst.includes(encoding as DateTimeKnownEncoding);
}

interface SdkDateTimeTypeBase extends SdkTypeBase {
  name: string;
  baseType?: SdkDateTimeType;
  /** How to encode the type on wire. */
  encode: DateTimeKnownEncoding | string;
  wireType: SdkBuiltInType;
  /** Unique ID for the current type. */
  crossLanguageDefinitionId: string;
}

interface SdkUtcDateTimeType extends SdkDateTimeTypeBase {
  kind: "utcDateTime";
}

interface SdkOffsetDateTimeType extends SdkDateTimeTypeBase {
  kind: "offsetDateTime";
}

export type SdkDateTimeType = SdkUtcDateTimeType | SdkOffsetDateTimeType;

export interface SdkDurationType extends SdkTypeBase {
  kind: "duration";
  name: string;
  baseType?: SdkDurationType;
  /** How to encode the type on wire. */
  encode: DurationKnownEncoding | string;
  wireType: SdkBuiltInType;
  /** Unique ID for the current type. */
  crossLanguageDefinitionId: string;
}

export interface SdkArrayType extends SdkTypeBase {
  kind: "array";
  name: string;
  valueType: SdkType;
  /** Unique ID for the current type. */
  crossLanguageDefinitionId: string;
}

export interface SdkTupleType extends SdkTypeBase {
  kind: "tuple";
  valueTypes: SdkType[];
}

export interface SdkDictionaryType extends SdkTypeBase {
  kind: "dict";
  keyType: SdkType;
  valueType: SdkType;
}

export interface SdkNullableType extends SdkTypeBase {
  kind: "nullable";
  name: string;
  /** Whether name is created by TCGC. */
  isGeneratedName: boolean;
  /** Unique ID for the current type. */
  crossLanguageDefinitionId: string;
  type: SdkType;
  /** Bitmap of the usage for the type. */
  usage: UsageFlags;
  /** Whether the type has public or private accessibility */
  access: AccessFlags;
  /** Full qualified namespace. */
  namespace: string;
}

export interface SdkEnumType extends SdkTypeBase {
  kind: "enum";
  name: string;
  /** Whether name is created by TCGC. */
  isGeneratedName: boolean;
  /** Full qualified namespace. */
  namespace: string;
  valueType: SdkBuiltInType;
  values: SdkEnumValueType[];
  isFixed: boolean;
  isFlags: boolean;
  /** Bitmap of the usage for the type. */
  usage: UsageFlags;
  /** Whether the type has public or private accessibility */
  access: AccessFlags;
  /** Unique ID for the current type. */
  crossLanguageDefinitionId: string;
  /** API versions supported for current type. */
  apiVersions: string[];
  isUnionAsEnum: boolean;
}

export interface SdkEnumValueType<
  TValueType extends SdkTypeBase = SdkBuiltInType,
> extends SdkTypeBase {
  kind: "enumvalue";
  name: string;
  value: string | number;
  enumType: SdkEnumType;
  valueType: TValueType;
  /** Unique ID for the current type. */
  crossLanguageDefinitionId: string;
}

export interface SdkConstantType extends SdkTypeBase {
  kind: "constant";
  value: string | number | boolean;
  valueType: SdkBuiltInType;
  name: string;
  /** Whether name is created by TCGC. */
  isGeneratedName: boolean;
}

export interface SdkUnionType<TValueType extends SdkTypeBase = SdkType> extends SdkTypeBase {
  name: string;
  /** Whether name is created by TCGC. */
  isGeneratedName: boolean;
  /** Full qualified namespace. */
  namespace: string;
  kind: "union";
  variantTypes: TValueType[];
  /** Unique ID for the current type. */
  crossLanguageDefinitionId: string;
  /** Whether the type has public or private accessibility. */
  access: AccessFlags;
  /** Bitmap of the usage for the type. */
  usage: UsageFlags;
  /** Info to distinguish between different union variants. */
  discriminatedOptions?: DiscriminatedOptions;
}

export interface DiscriminatedOptions {
  /** How is the discriminated union serialized.  */
  envelope: "object" | "none";
  /** Name of the discriminator property. */
  discriminatorPropertyName: string;
  /** Name of the property envelopping the data. `undefined` if envelope is "none" */
  envelopePropertyName?: string;
}

export interface SdkModelType extends SdkTypeBase {
  kind: "model";
  properties: SdkModelPropertyType[];
  name: string;
  /** Whether name is created by TCGC. */
  isGeneratedName: boolean;
  /** Full qualified namespace. */
  namespace: string;
  /** Whether the type has public or private accessibility */
  access: AccessFlags;
  /** Bitmap of the usage for the type. */
  usage: UsageFlags;
  additionalProperties?: SdkType;
  discriminatorValue?: string;
  discriminatedSubtypes?: Record<string, SdkModelType>;
  discriminatorProperty?: SdkModelPropertyType;
  baseModel?: SdkModelType;
  /** Unique ID for the current type. */
  crossLanguageDefinitionId: string;
  /** API versions supported for current type. */
  apiVersions: string[];
  serializationOptions: SerializationOptions;
}

/**
 * Initialization info for a client.
 */
export interface SdkClientInitializationType extends SdkTypeBase {
  kind: "clientinitialization";
  name: string;
  /** Whether name is created by TCGC. */
  isGeneratedName: boolean;
  /** Initialization parameters. */
  parameters: (SdkEndpointParameter | SdkCredentialParameter | SdkMethodParameter)[];
  /** How to initialize a client. */
  initializedBy: InitializedByFlags;
}

/**
 * Credential info.
 */
export interface SdkCredentialType extends SdkTypeBase {
  kind: "credential";
  /** Auth scheme. Reuse TypeSpec Http types. */
  scheme: HttpAuth;
}

/**
 * Endpoint info.
 */
export interface SdkEndpointType extends SdkTypeBase {
  kind: "endpoint";
  /**
   * The server URL for the endpoint.
   * If spec author does not specify the endpoint, we will use value "{endpoint}", and templateArguments will have one parameter called "endpoint"
   */
  serverUrl: string;
  /** Template arguments used in `serverUrl` string. */
  templateArguments: SdkPathParameter[];
}

export interface SdkModelPropertyTypeBase<
  TType extends SdkTypeBase = SdkType,
> extends DecoratedType {
  __raw?: ModelProperty;
  /** Parameter type. */
  type: TType;
  /** Parameter client name. */
  name: string;
  /** Whether name is created by TCGC. */
  isGeneratedName: boolean;
  /** Document for the type. */
  doc?: string;
  /** Summary for the type. */
  summary?: string;
  /** API versions supported for current type. */
  apiVersions: string[];
  /** Whether the type is on client level. */
  onClient: boolean;
  /** Client level default value for the type. */
  clientDefaultValue?: unknown;
  /** Whether the type is an API version parameter */
  isApiVersionParam: boolean;
  /** Whether the type is optional. */
  optional: boolean;
  /** Unique ID for the current type. */
  crossLanguageDefinitionId: string;
  /** Visibility of the type. */
  visibility?: Visibility[];
  /** Whether the type has public or private accessibility */
  access: AccessFlags;
  /** Whether this property could be flattened */
  flatten: boolean;
  /** How to encode the property on wire. */
  encode?: ArrayKnownEncoding;
}

export type ArrayKnownEncoding =
  | "pipeDelimited"
  | "spaceDelimited"
  | "commaDelimited"
  | "newlineDelimited";

/**
 * Options to show how to serialize a model/property.
 * A model/property that is used in multiple operations with different wire format could have multiple options set. For example, a model could be serialized as JSON in one operation and as XML in another operation.
 * A model/property that has no special serialization logic will have no options set. For example, a property that is used in a HTTP query parameter will have no serialization options set.
 * A model/property that is used as binary payloads will also have no options set. For example, a property that is used as a HTTP request body with `"image/png` content type.
 */
export interface SerializationOptions {
  json?: JsonSerializationOptions;
  xml?: XmlSerializationOptions;
  multipart?: MultipartOptions;
  binary?: BinarySerializationOptions;
}

/**
 * For Json serialization.
 * The name will come from explicit setting of `@encodedName("application/json", "NAME")` or original model/property name.
 */
export interface JsonSerializationOptions {
  name: string;
}

/**
 * For Xml serialization.
 * The `name`/`itemsName` will come from explicit setting of `@encodedName("application/xml", "NAME")` or `@xml.Name("NAME")` or original model/property name.
 * Other properties come from `@xml.attribute`, `@xml.ns`, `@xml.unwrapped`.
 * The `itemsName` and `itemsNs` are used for array items.
 * If `unwrapped` is `true`, `itemsName` should always be same as the `name`. If `unwrapped` is `false`, `itemsName` could have different name.
 */
export interface XmlSerializationOptions {
  name: string;
  attribute?: boolean;
  ns?: {
    namespace: string;
    prefix: string;
  };
  unwrapped?: boolean;

  itemsName?: string;
  itemsNs?: {
    namespace: string;
    prefix: string;
  };
}

export interface BinarySerializationOptions {
  /** Whether this is a file/stream input */
  isFile: boolean;
  /**
   * Whether the file contents should be represented as a string or raw byte stream.
   *
   * True if the `contents` property is a `string`, `false` if it is `bytes`.
   *
   * Emitters may choose to represent textual files as strings or streams of textual characters.
   * If this property is `false`, emitters must expect that the contents may contain non-textual
   * data.
   *
   * This property is only present when `isFile` is `true`. When undefined, it indicates the
   * body is not a file type.
   */
  isText?: boolean;
  /**
   * The list of inner media types of the file. In other words, what kind of files can be returned.
   *
   * This is determined by the `contentType` property of the file model.
   *
   * This property is only present when `isFile` is `true`. When undefined, it indicates the
   * body is not a file type.
   */
  contentTypes?: string[];
  /**
   * The ModelProperty that represents the filename in the file model.
   *
   * This property is only present when `isFile` is `true`. When undefined, it indicates the
   * body is not a file type.
   */
  filename?: ModelProperty;
}

/**
 * Endpoint parameter type for the client.
 */
export interface SdkEndpointParameter extends SdkModelPropertyTypeBase<
  SdkEndpointType | SdkUnionType<SdkEndpointType>
> {
  kind: "endpoint";
  /** Whether do url encode for the endpoint string. */
  urlEncode: boolean;
  /** Endpoint parameter is always on client level. */
  onClient: true;
  /**
   * @deprecated This property is deprecated. Use `type.templateArguments[x].serializedName` or `type.variantTypes[x].templateArguments[x].serializedName` instead.
   */
  serializedName?: string;
}

export interface SdkCredentialParameter extends SdkModelPropertyTypeBase<
  SdkCredentialType | SdkUnionType<SdkCredentialType>
> {
  kind: "credential";
  /** Credential parameter is always on client level. */
  onClient: true;
}

export interface MultipartOptions {
  /** Name of the part in the multipart payload. */
  name: string;
  /** Whether this part is for file */
  isFilePart: boolean;
  /** Whether this part is multi in request payload */
  isMulti: boolean;
  /** Undefined if filename is not set explicitly in Typespec */
  filename?: SdkModelPropertyType;
  /** Undefined if contentType is not set explicitly in Typespec */
  contentType?: SdkModelPropertyType;
  /** Default content types defined in Typespec or calculated by Typespec complier */
  defaultContentTypes: string[];
  /** Part headers */
  headers: SdkHeaderParameter[];
}

export interface SdkModelPropertyType extends SdkModelPropertyTypeBase {
  kind: "property";
  discriminator: boolean;
  /**
   * @deprecated This property is deprecated. Use `serializationOptions.xxx.name` instead.
   */
  serializedName: string;
  serializationOptions: SerializationOptions;
  /**
   * @deprecated This property is deprecated. Use `multipartOptions?.isFilePart` instead.
   */
  isMultipartFileInput: boolean;
  /**
   * @deprecated This property is deprecated. Use `serializationOptions.multipart` instead.
   */
  multipartOptions?: MultipartOptions;
}

export type CollectionFormat = "multi" | "csv" | "ssv" | "tsv" | "pipes" | "simple" | "form";

/**
 * Http header parameter.
 */
export interface SdkHeaderParameter extends SdkModelPropertyTypeBase {
  kind: "header";
  collectionFormat?: CollectionFormat;
  /** Name for the parameter in the payload */
  serializedName: string;
  /**
   * @deprecated This property is deprecated. Use `methodParameterSegments` instead.
   * Corresponding method level parameter or model property for current parameter.
   */
  correspondingMethodParams: (SdkMethodParameter | SdkModelPropertyType)[];
  /**
   * Segments to indicate the complete path from method parameters to this HTTP parameter.
   * Each inner array represents a complete path from method parameter to the final HTTP parameter.
   * For body parameters with spread, there can be multiple paths.
   */
  methodParameterSegments: (SdkMethodParameter | SdkModelPropertyType)[][];
}

/**
 * Http query parameter.
 */
export interface SdkQueryParameter extends SdkModelPropertyTypeBase {
  kind: "query";
  collectionFormat?: CollectionFormat;
  /** Name for the parameter in the payload */
  serializedName: string;
  /**
   * @deprecated This property is deprecated. Use `methodParameterSegments` instead.
   * Corresponding method level parameter or model property for current parameter.
   */
  correspondingMethodParams: (SdkMethodParameter | SdkModelPropertyType)[];
  /**
   * Segments to indicate the complete path from method parameters to this HTTP parameter.
   * Each inner array represents a complete path from method parameter to the final HTTP parameter.
   * For body parameters with spread, there can be multiple paths.
   */
  methodParameterSegments: (SdkMethodParameter | SdkModelPropertyType)[][];
  explode: boolean;
}

/**
 * Http path parameter.
 */
export interface SdkPathParameter extends SdkModelPropertyTypeBase {
  kind: "path";
  explode: boolean;
  style: "simple" | "label" | "matrix" | "fragment" | "path";
  allowReserved: boolean;
  /** Name for the parameter in the payload */
  serializedName: string;
  /**
   * @deprecated This property is deprecated. Use `methodParameterSegments` instead.
   * Corresponding method level parameter or model property for current parameter.
   */
  correspondingMethodParams: (SdkMethodParameter | SdkModelPropertyType)[];
  /**
   * Segments to indicate the complete path from method parameters to this HTTP parameter.
   * Each inner array represents a complete path from method parameter to the final HTTP parameter.
   * For body parameters with spread, there can be multiple paths.
   */
  methodParameterSegments: (SdkMethodParameter | SdkModelPropertyType)[][];
}

/**
 * Http cookie parameter.
 */
export interface SdkCookieParameter extends SdkModelPropertyTypeBase {
  kind: "cookie";
  /** Name for the parameter in the payload */
  serializedName: string;
  /**
   * @deprecated This property is deprecated. Use `methodParameterSegments` instead.
   * Corresponding method level parameter or model property for current parameter.
   */
  correspondingMethodParams: (SdkMethodParameter | SdkModelPropertyType)[];
  /**
   * Segments to indicate the complete path from method parameters to this HTTP parameter.
   * Each inner array represents a complete path from method parameter to the final HTTP parameter.
   * For body parameters with spread, there can be multiple paths.
   */
  methodParameterSegments: (SdkMethodParameter | SdkModelPropertyType)[][];
}

/**
 * Metadata about a streaming operation body or response.
 * Present when the body/response is a streaming type (e.g. JsonlStream, SSEStream).
 */
export interface SdkStreamMetadata {
  /** The type of the property decorated with `@body` (e.g. string, bytes). */
  bodyType: SdkType;
  /** The stream model type itself (e.g. HttpStream, JsonlStream, SSEStream). */
  originalType: SdkType;
  /** The payload model type being streamed (e.g. Thing from JsonlStream<Thing>). */
  streamType: SdkType;
  /** Content types associated with this stream (e.g. ["application/jsonl"], ["text/event-stream"]). */
  contentTypes: string[];
}

/**
 * Http body parameter.
 */
export interface SdkBodyParameter extends SdkModelPropertyTypeBase {
  kind: "body";
  /** Name for the parameter in the payload */
  serializedName: string;
  contentTypes: string[];
  defaultContentType: string;
  /**
   * @deprecated This property is deprecated. Use `methodParameterSegments` instead.
   * Corresponding method level parameter or model property for current parameter.
   */
  correspondingMethodParams: (SdkMethodParameter | SdkModelPropertyType)[];
  /**
   * Segments to indicate the complete path from method parameters to this HTTP parameter.
   * Each inner array represents a complete path from method parameter to the final HTTP parameter.
   * For body parameters with spread, there can be multiple paths.
   */
  methodParameterSegments: (SdkMethodParameter | SdkModelPropertyType)[][];
  /** Stream metadata, present when the body is a streaming type (e.g. JsonlStream, SSEStream). */
  streamMetadata?: SdkStreamMetadata;
  /** Options to show how to serialize the body. */
  serializationOptions: SerializationOptions;
}

export type SdkHttpParameter =
  | SdkQueryParameter
  | SdkPathParameter
  | SdkBodyParameter
  | SdkHeaderParameter
  | SdkCookieParameter;

export interface SdkMethodParameter extends SdkModelPropertyTypeBase {
  kind: "method";
}

export interface SdkServiceResponseHeader extends SdkModelPropertyTypeBase {
  __raw: ModelProperty;
  kind: "responseheader";
  serializedName: string;
}

export interface SdkMethodResponse {
  kind: "method";
  type?: SdkType;
  /**
   * An array of properties to fetch {result} from the {response} model. Note that this property is only for LRO and paging pattens.
   */
  resultSegments?: SdkModelPropertyType[];
  /**
   * Indicates whether the response type is optional. Set to true when the operation has at least one HTTP response without a body.
   * This allows distinguishing between responses without a body and responses with a body of type `Type | null`.
   */
  optional?: boolean;
  /** Stream metadata, present when the response is a streaming type (e.g. JsonlStream, SSEStream). */
  streamMetadata?: SdkStreamMetadata;
}

export interface SdkServiceResponse {
  type?: SdkType;
  headers: SdkServiceResponseHeader[];
  /** API versions supported for current type. */
  apiVersions: string[];
}

interface SdkHttpResponseBase extends SdkServiceResponse {
  __raw: HttpOperationResponse;
  kind: "http";
  contentTypes?: string[];
  defaultContentType?: string;
  description?: string;
  /** Stream metadata, present when the response is a streaming type (e.g. JsonlStream, SSEStream). */
  streamMetadata?: SdkStreamMetadata;
  /** Options to show how to deserialize the response body. */
  serializationOptions: SerializationOptions;
}

export interface SdkHttpResponse extends SdkHttpResponseBase {
  statusCodes: number | HttpStatusCodeRange;
}

export interface SdkHttpErrorResponse extends SdkHttpResponseBase {
  statusCodes: number | HttpStatusCodeRange | "*";
}

interface SdkServiceOperationBase {}

/**
 * Http operation.
 */
export interface SdkHttpOperation extends SdkServiceOperationBase {
  __raw: HttpOperation;
  kind: "http";
  /** Route path. */
  path: string;
  /** Route URI template string. */
  uriTemplate: string;
  /** Http verb. */
  verb: HttpVerb;
  /** Parameter lists. */
  parameters: (SdkPathParameter | SdkQueryParameter | SdkHeaderParameter | SdkCookieParameter)[];
  /** Body parameter. */
  bodyParam?: SdkBodyParameter;
  /** Normal responses. */
  responses: SdkHttpResponse[];
  /** Error responses */
  exceptions: SdkHttpErrorResponse[];
  /** Operation usage examples. */
  examples?: SdkHttpOperationExample[];
}

/**
 * We eventually will include other kinds of service operations, i.e. grpc. For now, it's just Http.
 */

export type SdkServiceOperation = SdkHttpOperation;

export interface SdkServiceMethodBase<
  TServiceOperation extends SdkServiceOperation,
> extends DecoratedType {
  __raw?: Operation;
  name: string;
  /** Whether the type has public or private accessibility */
  access: AccessFlags;
  /** API versions supported for current type. */
  apiVersions: string[];
  /** Document for the type. */
  doc?: string;
  /** Summary for the type. */
  summary?: string;
  /** Unique ID for the current type. */
  crossLanguageDefinitionId: string;
  /** Method's underlying protocol operation. */
  operation: TServiceOperation;
  /** Method's parameters. */
  parameters: SdkMethodParameter[];
  /** Method's normal responses. */
  response: SdkMethodResponse;
  /** Method's error responses. */
  exception?: SdkMethodResponse;
  /** Whether generate convenient API for this method. */
  generateConvenient: boolean;
  /** Whether generate protocol API for this method. */
  generateProtocol: boolean;
  /** Whether this method is overridded. */
  isOverride: boolean;
}

/**
 * Basic method.
 */
export interface SdkBasicServiceMethod<
  TServiceOperation extends SdkServiceOperation,
> extends SdkServiceMethodBase<TServiceOperation> {
  kind: "basic";
}

/**
 * Paging operation info.
 */
export interface SdkPagingServiceMethodOptions<TServiceOperation extends SdkServiceOperation> {
  /** Paging info. */
  pagingMetadata: SdkPagingServiceMetadata<TServiceOperation>;
}

/**
 * Paging operation metadata.
 */
export interface SdkPagingServiceMetadata<TServiceOperation extends SdkServiceOperation> {
  /** Paging metadata from TypeSpec core library. */
  __raw?: PagingOperation;

  /** Segments to indicate how to get next page link value from response. */
  nextLinkSegments?: (SdkServiceResponseHeader | SdkModelPropertyType)[];
  /** Method used to get next page. If not defined, use the initial method. */
  nextLinkOperation?: SdkServiceMethod<TServiceOperation>;
  /** HTTP verb to use for the next link operation. Defaults to "GET" if not specified. */
  nextLinkVerb?: "GET" | "POST";
  /** Segments to indicate how to get parameters that are needed to be injected into next page link. */
  nextLinkReInjectedParametersSegments?: (SdkMethodParameter | SdkModelPropertyType)[][];
  /** Segments to indicate how to set continuation token for next page request. */
  continuationTokenParameterSegments?: (SdkMethodParameter | SdkModelPropertyType)[];
  /** Segments to indicate how to get continuation token value from response. */
  continuationTokenResponseSegments?: (SdkServiceResponseHeader | SdkModelPropertyType)[];
  /** Segments to indicate how to get page items from response. */
  pageItemsSegments?: SdkModelPropertyType[];
  /** Denotes which parameter is the page size parameter */
  pageSizeParameterSegments?: (SdkMethodParameter | SdkModelPropertyType)[];
}

/**
 * Paging method.
 */
export interface SdkPagingServiceMethod<TServiceOperation extends SdkServiceOperation>
  extends
    SdkServiceMethodBase<TServiceOperation>,
    SdkPagingServiceMethodOptions<TServiceOperation> {
  kind: "paging";
}

export type SdkServiceMethod<TServiceOperation extends SdkServiceOperation> =
  | SdkBasicServiceMethod<TServiceOperation>
  | SdkPagingServiceMethod<TServiceOperation>;

export type SdkMethod<TServiceOperation extends SdkServiceOperation> =
  SdkServiceMethod<TServiceOperation>;

/**
 * Represents a client package, containing all clients, operations, and types.
 */
export interface SdkPackage<TServiceOperation extends SdkServiceOperation> {
  /** First level clients of the package. */
  clients: SdkClientType<TServiceOperation>[];
  /** All used models in the package. */
  models: SdkModelType[];
  /** All used enumerations in the package. */
  enums: SdkEnumType[];
  /** All used unions or nullable types in the package. */
  unions: (SdkUnionType | SdkNullableType)[];
  /** Unique ID for the package. */
  crossLanguagePackageId: string;
  /** Hash of API-affecting elements for cross-language SDK comparison. */
  crossLanguageVersion: string;
  /** Hierarchical structure for the package based on namespaces. */
  namespaces: SdkNamespace<TServiceOperation>[];
  /** License details for client code comments or license file generation. */
  licenseInfo?: LicenseInfo;
  /** Metadata for the package. */
  metadata: {
    /**
     * @deprecated Use `apiVersions` instead. This property will be removed in a future release.
     *
     * The version of the package.
     * If undefined, the package is not versioned.
     * If `all`, the package is versioned with all versions.
     * If a string, the package is versioned with the specified version.
     */
    apiVersion?: string;
    /**
     * The version map of the package.
     * Key is the service namespace full qualified name, value is the version.
     * If value is undefined, the package is not versioned.
     * If value is a string, the service is versioned with the specified version.
     */
    apiVersions?: Map<string, string>;
  };
}

/**
 * License details for client code comments or license file generation.
 */
export interface LicenseInfo {
  /** License name. */
  name: string;
  /** Company name. */
  company: string;
  /** License document link. */
  link: string;
  /** Header comments. */
  header: string;
  /** License file content. */
  description: string;
}

/**
 * Represents a namespace in the package, containing all clients, operations, and types.
 */
export interface SdkNamespace<TServiceOperation extends SdkServiceOperation> extends DecoratedType {
  __raw?: Namespace;
  /** Namespace name. */
  name: string;
  /** Namespace full qualified name. */
  fullName: string;
  /** Clients under this namespace. */
  clients: SdkClientType<TServiceOperation>[];
  /** Models used in package under this namespace. */
  models: SdkModelType[];
  /** Enumerations used in package under this namespace. */
  enums: SdkEnumType[];
  /** Unions or nullable types used in package under this namespace. */
  unions: (SdkUnionType | SdkNullableType)[];
  /** Nested namespaces under this namespace. */
  namespaces: SdkNamespace<TServiceOperation>[];
}

export type SdkHttpPackage = SdkPackage<SdkHttpOperation>;

export type LanguageScopes = "dotnet" | "java" | "python" | "javascript" | "go" | string;

interface SdkExampleBase {
  kind: string;
  name: string;
  doc: string;
  filePath: string;
  rawExample: any;
}

export interface SdkHttpOperationExample extends SdkExampleBase {
  kind: "http";
  parameters: SdkHttpParameterExampleValue[];
  responses: SdkHttpResponseExampleValue[];
}

export interface SdkHttpParameterExampleValue {
  parameter: SdkHttpParameter;
  value: SdkExampleValue;
}

export interface SdkHttpResponseExampleValue {
  response: SdkHttpResponse;
  statusCode: number;
  headers: SdkHttpResponseHeaderExampleValue[];
  bodyValue?: SdkExampleValue;
}

export interface SdkHttpResponseHeaderExampleValue {
  header: SdkServiceResponseHeader;
  value: SdkExampleValue;
}

export type SdkExampleValue =
  | SdkStringExampleValue
  | SdkNumberExampleValue
  | SdkBooleanExampleValue
  | SdkNullExampleValue
  | SdkUnknownExampleValue
  | SdkArrayExampleValue
  | SdkDictionaryExampleValue
  | SdkUnionExampleValue
  | SdkModelExampleValue;

interface SdkExampleValueBase {
  kind: string;
  type: SdkType;
  value: unknown;
}

export interface SdkStringExampleValue extends SdkExampleValueBase {
  kind: "string";
  type:
    | SdkBuiltInType
    | SdkDateTimeType
    | SdkDurationType
    | SdkEnumType
    | SdkEnumValueType
    | SdkConstantType;
  value: string;
}

export interface SdkNumberExampleValue extends SdkExampleValueBase {
  kind: "number";
  type:
    | SdkBuiltInType
    | SdkDateTimeType
    | SdkDurationType
    | SdkEnumType
    | SdkEnumValueType
    | SdkConstantType;
  value: number;
}

export interface SdkBooleanExampleValue extends SdkExampleValueBase {
  kind: "boolean";
  type: SdkBuiltInType | SdkConstantType;
  value: boolean;
}

export interface SdkNullExampleValue extends SdkExampleValueBase {
  kind: "null";
  type: SdkNullableType;
  value: null;
}

export interface SdkUnknownExampleValue extends SdkExampleValueBase {
  kind: "unknown";
  type: SdkBuiltInType;
  value: unknown;
}

export interface SdkArrayExampleValue extends SdkExampleValueBase {
  kind: "array";
  type: SdkArrayType;
  value: SdkExampleValue[];
}

export interface SdkDictionaryExampleValue extends SdkExampleValueBase {
  kind: "dict";
  type: SdkDictionaryType;
  value: Record<string, SdkExampleValue>;
}

export interface SdkUnionExampleValue extends SdkExampleValueBase {
  kind: "union";
  type: SdkUnionType;
  value: unknown;
}

export interface SdkModelExampleValue extends SdkExampleValueBase {
  kind: "model";
  type: SdkModelType;
  value: Record<string, SdkExampleValue>;
  additionalPropertiesValue?: Record<string, SdkExampleValue>;
}
