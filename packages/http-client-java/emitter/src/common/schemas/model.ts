// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import type { XmlSerializationFormat } from "../formats/xml.js";
import type { ChoiceSchema, SealedChoiceSchema } from "./choice.js";
import type { ConstantSchema } from "./constant.js";
import type { OrSchema } from "./relationship.js";
import type { DurationSchema } from "./time.js";
import type { SchemaUsage } from "./usage.js";

/** possible schema types that indicate the type of schema.
 *
 * @note - this is essentially a discriminator for Schema
 */
export enum SchemaType {
  /** a collection of items */
  Array = "array",
  /** an associative array (ie, dictionary, hashtable, etc) */
  Dictionary = "dictionary",
  /** a true or false value */
  Boolean = "boolean",
  /** an integer value */
  Integer = "integer",
  /** a number value */
  Number = "number",
  /** an object of some type */
  Object = "object",
  /** a string of characters  */
  String = "string",
  /** UnixTime */
  UnixTime = "unixtime",
  /** ByteArray -- an array of bytes */
  ByteArray = "byte-array",
  Binary = "binary",
  /** a Date */
  Date = "date",
  /** a Date */
  Time = "time",
  /** a DateTime */
  DateTime = "date-time",
  /** a Duration */
  Duration = "duration",
  /** a universally unique identifier  */
  Uuid = "uuid",
  /** an URI of some kind */
  Uri = "uri",
  /** a type that can be anything */
  Any = "any",
  /** a choice between one of several  values (ie, 'enum')
   *
   * @description - this is essentially can be thought of as an 'enum'
   * that is a choice between one of several strings
   */
  Choice = "choice",
  SealedChoice = "sealed-choice",
  /** a constant value */
  Constant = "constant",
  Or = "or",
  Group = "group",
}

export enum ImplementationLocation {
  /** should be exposed as a method parameter in the operation */
  Method = "Method",
  /** should be exposed as a client parameter (not exposed in the operation directly) */
  Client = "Client",
  /** should be used as input to constructing the context of the client (ie, 'profile') */
  Context = "Context",
}

/** the location that this parameter is placed in the http request */
export enum ParameterLocation {
  /** Used to encode the parameter and send it as the HTTP body  */
  Body = "body",
  /**  Custom headers that are expected as part of the request. Note that RFC7230 states header names are case insensitive. */
  Header = "header",
  /**  Parameters that are appended to the URL. For example, in /items?id=###, the query parameter is id */
  Query = "query",
  /**  Used together with Path Templating, where the parameter value is actually part of the operation's URL. This does not include the host or base path of the API. For example, in /items/{itemId}, the path parameter is itemId. */
  Path = "path",
  /** Used to associate the parameter to the Server/Uri (ie, parameterized host ) */
  Uri = "uri",
  /** Used to pass a specific cookie value to the API. */
  Cookie = "cookie",
}

/**
 * The Serialization Style used for the parameter.
 *
 * Describes how the parameter value will be serialized depending on the type of the parameter value.
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#style-examples
 *
 */
export enum SerializationStyle {
  /**
   * Simple style parameters defined by RFC6570. This option replaces collectionFormat with a csv value from OpenAPI 2.0.
   *
   * @default - path and header
   * @type array
   * @in path, header
   */
  Simple = "simple",
  /**
   * Form style parameters defined by RFC6570. This option replaces collectionFormat with a csv (when explode is false) or multi (when explode is true) value from OpenAPI 2.0.
   *
   * @default - query and cookie
   * @type primitive, array, object
   * @in query, cookie, body
   */
  Form = "form",
  /**
   * Space separated array values. This option replaces collectionFormat equal to ssv from OpenAPI 2.0.
   *
   * @type array
   * @in query
   */
  SpaceDelimited = "spaceDelimited",
  /**
   * Pipe separated array values. This option replaces collectionFormat equal to pipes from OpenAPI 2.0.
   *
   * @type array
   * @in query
   */
  PipeDelimited = "pipeDelimited",
  /**
   * Tab delimited array
   */
  TabDelimited = "tabDelimited",
}

export enum KnownMediaType {
  Json = "json",
  Xml = "xml",
  Form = "form",
  Binary = "binary",
  Multipart = "multipart",
  Text = "text",
  Unknown = "unknown",
}

/** A dictionary of open-ended 'x-*' extensions propogated from the original source document.
 *
 * @note - any unrecognized non-schema extensions found in the source model will be copied here verbatim
 *
 */
export interface Extensions {
  /** additional metadata extensions dictionary
   *
   * @notes - undefined means that there are no extensions present on the node.
   */
  extensions?: { "x-ms-priority"?: number; [key: string]: unknown };
}

/** the bare-minimum fields for per-language metadata on a given aspect */
export interface Language {
  /** name used in actual implementation */
  name: string;
  /** description text - describes this node. */
  description: string;
  namespace?: string;
  summary?: string;
  serializedName?: string;
  crossLanguageDefinitionId?: string;
  comment?: string;
}

/** custom extensible metadata for individual language generators */
export interface Languages {
  default: Language;
  java?: Partial<Language>;
}

export interface HttpProtocol {
  in?: `${ParameterLocation}`;
  style?: SerializationStyle;
  explode?: boolean;
  skipUriEncoding?: boolean;
  path?: string;
  uri?: string;
  method?: string;
  statusCodes?: string[];
  knownMediaType?: KnownMediaType;
  mediaTypes?: string[];
  headers?: HttpHeader[];
}

/** common pattern for Metadata on aspects */
export interface Metadata extends Extensions {
  /** per-language information for this aspect */
  language: Languages;
  /** per-protocol information for this aspect  */
  protocol: { http?: HttpProtocol };
}

/** an expression of an API version or api version range.
 *
 * @description - since API version formats range from
 * Azure ARM API date style (2018-01-01) to semver (1.2.3)
 * and virtually any other text, this value tends to be an
 * opaque string with the possibility of a modifier to indicate
 * that it is a range.
 *
 * options:
 *   - prepend a dash or append a plus to indicate a range
 *     (ie, '2018-01-01+' or '-2019-01-01', or '1.0+' )
 *
 *   - semver-range style (ie, '^1.0.0' or '~1.0.0' )
 */
export interface ApiVersion {
  /** the actual api version string used in the API */
  version: string;
}

export type ApiVersions = ApiVersion[];

/** the base interface that represents an aspect of the model. */
export interface Aspect extends Metadata {
  /** a short description
   *
   * @note - this should not be the description over again.
   */
  summary?: string;
  /** API versions that this applies to. Undefined means all versions */
  apiVersions?: ApiVersions;
  /**
   * Represent the deprecation information if api is deprecated.
   * @default undefined
   */
  deprecated?: { message?: string };
  /** where did this aspect come from (jsonpath or 'modelerfour:<soemthing>') */
  origin?: string;
  /** External Documentation Links */
  externalDocs?: { url: string; description?: string };
}

export type ModelOptions<T extends Metadata> = Partial<Omit<T, "language" | "protocol">> & {
  language?: { default?: Partial<Language>; java?: Partial<Language> };
  protocol?: Metadata["protocol"];
};

export function initializeMetadata<T extends Metadata>(
  target: T,
  options: ModelOptions<T> = {},
): T {
  return {
    ...target,
    ...options,
    language: {
      ...target.language,
      ...options.language,
      default: { ...target.language.default, ...options.language?.default },
    },
    protocol: { ...target.protocol, ...options.protocol },
  };
}

export function createMetadata(options?: ModelOptions<Metadata>): Metadata {
  return initializeMetadata(
    { language: { default: { name: "", description: "" } }, protocol: {} },
    options,
  );
}

export function createAspect(
  name: string,
  description: string,
  options?: ModelOptions<Aspect>,
): Aspect {
  return initializeMetadata(
    { language: { default: { name, description } }, protocol: {} },
    options,
  );
}

export interface SerializationFormat extends Extensions {}

export interface BaseSchema extends Aspect, SchemaUsage {
  type: SchemaType;
  example?: unknown;
  defaultValue?: unknown;
  serialization?: { xml?: XmlSerializationFormat };
  encode?: string;
  crossLanguageDefinitionId?: string;
}

export type Schema =
  | PrimitiveSchema
  | AnySchema
  | BinarySchema
  | ByteArraySchema
  | ArraySchema
  | DictionarySchema
  | ObjectSchema
  | GroupSchema
  | ChoiceSchema
  | SealedChoiceSchema
  | ConstantSchema
  | OrSchema;

export type PrimitiveSchema =
  | StringSchema
  | BooleanSchema
  | NumberSchema
  | DateSchema
  | TimeSchema
  | DateTimeSchema
  | UnixTimeSchema
  | DurationSchema
  | UriSchema
  | UuidSchema;

export function isPrimitiveSchema(schema: Schema): schema is PrimitiveSchema {
  switch (schema.type) {
    case SchemaType.String:
    case SchemaType.Boolean:
    case SchemaType.Integer:
    case SchemaType.Number:
    case SchemaType.Date:
    case SchemaType.Time:
    case SchemaType.DateTime:
    case SchemaType.UnixTime:
    case SchemaType.Duration:
    case SchemaType.Uri:
    case SchemaType.Uuid:
      return true;
    default:
      return false;
  }
}

export function createSchema<T extends SchemaType>(
  name: string,
  description: string,
  type: T,
): BaseSchema & { type: T } {
  return { ...createAspect(name, description), type };
}

function createPrimitive<T extends SchemaType>(name: string, description: string, type: T) {
  // Preserve the legacy treatment of compiler-generated primitive names.
  return createSchema(name.includes("\u00b7") ? type : name, description, type);
}

/** a Schema that represents a string value */
export interface StringSchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.String;
  /** the maximum length of the string */
  maxLength?: number;
  /** the minimum length of the string */
  minLength?: number;
  /** a regular expression that the string must be validated against */
  pattern?: string;
}
export function createStringSchema(
  name: string,
  description: string,
  options?: ModelOptions<StringSchema>,
): StringSchema {
  return initializeMetadata(createPrimitive(name, description, SchemaType.String), options);
}

/** a schema that represents a boolean value */
export interface BooleanSchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.Boolean;
}
export function createBooleanSchema(
  name: string,
  description: string,
  options?: ModelOptions<BooleanSchema>,
): BooleanSchema {
  return initializeMetadata(createPrimitive(name, description, SchemaType.Boolean), options);
}

/** a Schema that represents a Number value */
export interface NumberSchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.Number | SchemaType.Integer;
  /** precision (# of bits?) of the number */
  precision: number;
  /** if present, the number must be an exact multiple of this value */
  multipleOf?: number;
  /** if present, the value must be lower than or equal to this (unless exclusiveMaximum is true)  */
  maximum?: number;
  /** if present, the value must be lower than maximum   */
  exclusiveMaximum?: boolean;
  /** if present, the value must be highter than or equal to this (unless exclusiveMinimum is true)  */
  minimum?: number;
  /** if present, the value must be higher than minimum   */
  exclusiveMinimum?: boolean;
}
export function createNumberSchema(
  name: string,
  description: string,
  type: NumberSchema["type"],
  precision: number,
  options?: ModelOptions<NumberSchema>,
): NumberSchema {
  return initializeMetadata({ ...createPrimitive(name, description, type), precision }, options);
}

/** a schema that represents a Date value */
export interface DateSchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.Date;
}
export function createDateSchema(
  name: string,
  description: string,
  options?: ModelOptions<DateSchema>,
): DateSchema {
  return initializeMetadata(createPrimitive(name, description, SchemaType.Date), options);
}

/** a schema that represents a Date value */
export interface TimeSchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.Time;
}
export function createTimeSchema(
  name: string,
  description: string,
  options?: ModelOptions<TimeSchema>,
): TimeSchema {
  return initializeMetadata(createPrimitive(name, description, SchemaType.Time), options);
}

/** a schema that represents a DateTime value */
export interface DateTimeSchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.DateTime;
  /** date-time format  */
  format?: "date-time-rfc1123" | "date-time";
}
export function createDateTimeSchema(
  name: string,
  description: string,
  options?: ModelOptions<DateTimeSchema>,
): DateTimeSchema {
  return initializeMetadata(createPrimitive(name, description, SchemaType.DateTime), options);
}

/** a schema that represents a UnixTime value */
export interface UnixTimeSchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.UnixTime;
}
export function createUnixTimeSchema(
  name: string,
  description: string,
  options?: ModelOptions<UnixTimeSchema>,
): UnixTimeSchema {
  return initializeMetadata(createPrimitive(name, description, SchemaType.UnixTime), options);
}

/** a schema that represents a Uri value */
export interface UriSchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.Uri;
  /** the maximum length of the string */
  maxLength?: number;
  /** the minimum length of the string */
  minLength?: number;
  /** a regular expression that the string must be validated against */
  pattern?: string;
}
export function createUriSchema(
  name: string,
  description: string,
  options?: ModelOptions<UriSchema>,
): UriSchema {
  return initializeMetadata(createPrimitive(name, description, SchemaType.Uri), options);
}

/** a schema that represents a Uuid value */
export interface UuidSchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.Uuid;
}
export function createUuidSchema(
  name: string,
  description: string,
  options?: ModelOptions<UuidSchema>,
): UuidSchema {
  return initializeMetadata(createPrimitive(name, description, SchemaType.Uuid), options);
}

export interface AnySchema extends BaseSchema {
  type: SchemaType.Any;
}
export function createAnySchema(description: string, options?: ModelOptions<AnySchema>): AnySchema {
  return initializeMetadata(createSchema("any", description, SchemaType.Any), options);
}

export interface BinarySchema extends BaseSchema {
  type: SchemaType.Binary;
}
export function createBinarySchema(
  description: string,
  options?: ModelOptions<BinarySchema>,
): BinarySchema {
  return initializeMetadata(createSchema("binary", description, SchemaType.Binary), options);
}

/** a schema that represents a ByteArray value */
export interface ByteArraySchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.ByteArray;
  /** date-time format  */
  format?: "base64url" | "byte";
}
export function createByteArraySchema(
  name: string,
  description: string,
  options?: ModelOptions<ByteArraySchema>,
): ByteArraySchema {
  return initializeMetadata(createSchema(name, description, SchemaType.ByteArray), options);
}

/** a Schema that represents and array of values */
export interface ArraySchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.Array;
  /** elementType of the array */
  elementType: Schema;
  /** maximum number of elements in the array */
  maxItems?: number;
  /** minimum number of elements in the array */
  minItems?: number;
  /** if the elements in the array should be unique */
  uniqueItems?: boolean;
  /** if elements in the array should be nullable */
  nullableItems?: boolean;
}
export function createArraySchema(
  name: string,
  description: string,
  elementType: Schema,
  options?: ModelOptions<ArraySchema>,
): ArraySchema {
  return initializeMetadata(
    { ...createSchema(name, description, SchemaType.Array), elementType },
    options,
  );
}

/** a schema that represents a key-value collection */
export interface DictionarySchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.Dictionary;
  // Recursive dictionaries are cached before their element is resolved.
  /** the element type of the dictionary. (Keys are always strings) */
  elementType: Schema | null;
  /** if elements in the dictionary should be nullable */
  nullableItems?: boolean;
}
export function createDictionarySchema(
  name: string,
  description: string,
  elementType: Schema | null,
  options?: ModelOptions<DictionarySchema>,
): DictionarySchema {
  return initializeMetadata(
    { ...createSchema(name, description, SchemaType.Dictionary), elementType },
    options,
  );
}

export interface Relations {
  immediate: Schema[];
  all: Schema[];
}
export function createRelations(): Relations {
  return { immediate: [], all: [] };
}

export interface Discriminator {
  property: Property;
  immediate: Record<string, Schema>;
  all: Record<string, Schema>;
}
export function createDiscriminator(property: Property): Discriminator {
  return { property, immediate: {}, all: {} };
}

/** a schema that represents a type with child properties. */
export interface ObjectSchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.Object;
  /** the property of the polymorphic descriminator for this type, if there is one */
  discriminator?: Discriminator;
  /** the collection of properties that are in this object */
  properties?: Array<Property>;
  /**  maximum number of properties permitted */
  maxProperties?: number;
  /**  minimum number of properties permitted */
  minProperties?: number;
  parents?: Relations;
  children?: Relations;
  discriminatorValue?: string;
}
export function createObjectSchema(
  name: string,
  description: string,
  options?: ModelOptions<ObjectSchema>,
): ObjectSchema {
  return initializeMetadata(createSchema(name, description, SchemaType.Object), options);
}

export interface GroupSchema extends BaseSchema {
  type: SchemaType.Group;
  properties?: Array<GroupProperty>;
}
export function createGroupSchema(
  name: string,
  description: string,
  options?: ModelOptions<GroupSchema>,
): GroupSchema {
  return initializeMetadata(createSchema(name, description, SchemaType.Group), options);
}

export function addProperty<T extends Property>(schema: { properties?: T[] }, property: T): T {
  (schema.properties ??= []).push(property);
  return property;
}

/** common base interface for properties, parameters and the like.  */
export interface Value extends Aspect {
  /** the schema of this Value */
  schema: Schema;
  /** if the value is marked 'required'. */
  required?: boolean;
  /** can null be passed in instead  */
  nullable?: boolean;
  /** the value that the client should provide if the consumer doesn't provide one */
  clientDefaultValue?: unknown;
}
/** a property is a child value in an object */
export interface Property extends Value {
  /** if the property is marked read-only (ie, not intended to be sent to the service) */
  readOnly?: boolean;
  /** the wire name of this property */
  serializedName: string;
  /** when a property is flattened, the property will be the set of serialized names to get to that target property.
   *
   * If flattenedName is present, then this property is a flattened property.
   *
   * (ie, ['properties','name'] )
   *
   */
  flattenedNames?: Array<string>;
  /** if this property is used as a discriminator for a polymorphic type */
  isDiscriminator?: boolean;
}
export function createProperty(
  name: string,
  description: string,
  schema: Schema,
  options?: ModelOptions<Property>,
): Property {
  return initializeMetadata(
    { ...createAspect(name, description), schema, serializedName: name },
    { ...options, schema },
  );
}

/** a definition of an discrete input for an operation */
export interface Parameter extends Value {
  /** suggested implementation location for this parameter */
  implementation?: ImplementationLocation;
  /** When a parameter is flattened, it will be left in the list, but marked hidden (so, don't generate those!) */
  flattened?: boolean;
  /** When a parameter is grouped into another, this will tell where the parameter got grouped into. */
  groupedBy?: Parameter;
  /**
   * If this parameter is only part of the body request(for multipart and form bodies.)
   */
  isPartialBody?: boolean;
}
export function createParameter(
  name: string,
  description: string,
  schema: Schema,
  options?: ModelOptions<Parameter>,
): Parameter {
  return initializeMetadata({ ...createAspect(name, description), schema }, options);
}

export interface VirtualParameter extends Parameter {
  /** the original body parameter that this parameter is in effect replacing  */
  originalParameter: Parameter;
  /** the target property this virtual parameter represents */
  targetProperty: Property;
  /** if this parameter is for a nested property, this is the path of properties it takes to get there */
  pathToProperty?: Property[];
}
export function createVirtualParameter(
  name: string,
  description: string,
  schema: Schema,
  options: ModelOptions<VirtualParameter> &
    Pick<VirtualParameter, "originalParameter" | "targetProperty">,
): VirtualParameter {
  return initializeMetadata(
    {
      ...createParameter(name, description, schema),
      originalParameter: options.originalParameter,
      targetProperty: options.targetProperty,
    },
    { ...options, schema },
  );
}
export function isVirtualParameter(parameter: Parameter): parameter is VirtualParameter {
  return "originalParameter" in parameter;
}

export interface GroupProperty extends Property {
  originalParameter: Array<Parameter>;
}
export function createGroupProperty(
  name: string,
  description: string,
  schema: Schema,
  options?: ModelOptions<GroupProperty>,
): GroupProperty {
  return initializeMetadata<GroupProperty>(
    { ...createProperty(name, description, schema), originalParameter: [] },
    { ...options, schema, originalParameter: [...(options?.originalParameter ?? [])] },
  );
}

export interface HttpHeader extends Extensions {
  header: string;
  schema: Schema;
  language: { default?: Partial<Language>; java?: Partial<Language> };
}
export function createHttpHeader(
  header: string,
  schema: Schema,
  options: Partial<HttpHeader> & Pick<HttpHeader, "language">,
): HttpHeader {
  return { header, schema, ...options };
}
export function createHttpParameter(
  location: `${ParameterLocation}`,
  options?: Partial<HttpProtocol>,
): HttpProtocol {
  return { in: location, ...options };
}

/** a response from a service.  */
export interface Response extends Metadata {}
/** a response where the content should be treated as a binary instead of a value or object */
export interface BinaryResponse extends Response {
  /** indicates that this response is a binary stream  */
  binary: true;
}
/** a response that should be deserialized into a result of type(schema) */
export interface SchemaResponse extends Response {
  /** the content returned by the service for a given operaiton */
  schema: Schema;
  /** indicates whether the response can be 'null' */
  nullable?: boolean;
}
export function createResponse(options?: ModelOptions<Response>): Response {
  return createMetadata(options);
}
export function createBinaryResponse(options?: ModelOptions<BinaryResponse>): BinaryResponse {
  return initializeMetadata({ ...createMetadata(), binary: true }, options);
}
export function createSchemaResponse(
  schema: Schema,
  options?: ModelOptions<SchemaResponse>,
): SchemaResponse {
  return initializeMetadata({ ...createMetadata(), schema }, options);
}
export function isSchemaResponse(response: Response): response is SchemaResponse {
  return "schema" in response;
}

/** an individual choice in a ChoiceSchema */
export interface ChoiceValue extends Extensions {
  /** per-language information for this value */
  language: Languages;
  /** the actual value  */
  value: string | number | boolean;
}
export function createChoiceValue(
  name: string,
  description: string,
  value: ChoiceValue["value"],
): ChoiceValue {
  return { value, language: { default: { name, description } } };
}

/** code model information */
export interface Info extends Extensions {
  /** the title of this service. */
  title: string;
  /** a text description of the service  */
  description?: string;
  /** license information for th service */
  license?: License;
}
/** license information  */
export interface License extends Extensions {
  /** the nameof the license */
  name: string;
  /** an uri pointing to the full license text */
  url?: string;
  extensions?: Extensions["extensions"] & { header?: string; company?: string };
}
export function createInfo(title: string, options?: Partial<Info>): Info {
  return { title, ...options };
}
export function createLicense(name: string, options?: Partial<License>): License {
  return { name, ...options };
}

/**
 * The security information for the API surface
 */
export interface Security {
  /**
   * indicates that the API surface requires authentication
   */
  authenticationRequired: boolean;
  /**
   * @items {"type": "SecuritySchemeFull"}
   */
  schemes: SecurityScheme[];
}
export type SecurityScheme = KeySecurityScheme | OAuth2SecurityScheme;
export interface KeySecurityScheme {
  type: "Key";
  name: string;
  in?: "header";
  prefix?: string;
}
export interface OAuth2SecurityScheme {
  type: "OAuth2";
  scopes: string[];
  flows?: unknown;
}
export function createSecurity(
  authenticationRequired: boolean,
  options?: Partial<Security>,
): Security {
  return { authenticationRequired, ...options, schemes: [...(options?.schemes ?? [])] };
}
export function createKeySecurityScheme(
  options: Omit<KeySecurityScheme, "type">,
): KeySecurityScheme {
  return { type: "Key", ...options };
}
export function createOAuth2SecurityScheme(
  options: Omit<OAuth2SecurityScheme, "type">,
): OAuth2SecurityScheme {
  return { type: "OAuth2", ...options };
}
