import type { ArrayKnownEncoding } from "@azure-tools/typespec-client-generator-core";
import type { XmlSerializationFormat } from "./formats/xml.js";
import type { OperationGroup } from "./operation.js";
import type {
  Aspect,
  HttpHeader,
  Metadata,
  ModelOptions,
  Parameter,
  Property,
  Security,
} from "./schemas/model.js";
import { createAspect, createSecurity, initializeMetadata } from "./schemas/model.js";

export interface Client extends Aspect {
  /** All operations  */
  operationGroups: Array<OperationGroup>;

  globalParameters?: Array<Parameter>;

  security: Security;

  serviceVersion?: ServiceVersion; // for ServiceVersion class

  /**
   * Parent client of this client, if exists.
   */
  parent?: Client;
  /**
   * Sub clients of this client, if exists.
   */
  subClients: Array<Client>;
  /**
   * Whether the Builder class has a public method (e.g. "buildSubClient") to initiate this client.
   */
  buildMethodPublic: boolean;
  /**
   * Whether the parent client has a public accessor method (e.g. "getSubClient") to initiate this client.
   */
  parentAccessorPublic: boolean;
}

export function createClient(
  name: string,
  description: string,
  options?: ModelOptions<Client>,
): Client {
  return initializeMetadata<Client>(
    {
      ...createAspect(name, description),
      operationGroups: [],
      security: createSecurity(false),
      subClients: [],
      buildMethodPublic: true,
      parentAccessorPublic: false,
    },
    {
      ...options,
      operationGroups: [...(options?.operationGroups ?? [])],
      security: createSecurity(
        options?.security?.authenticationRequired ?? false,
        options?.security,
      ),
      subClients: [...(options?.subClients ?? [])],
    },
  );
}

export function addGlobalParameters(client: Client, parameters: Parameter[]) {
  (client.globalParameters ??= []).push(...parameters);
}

/**
 * Add a sub Client to Client.
 *
 * @param subClient the sub Client
 * @param buildMethodPublic the sub Client can be initialized by its ClientBuilder
 * @param parentAccessorPublic the sub Client can be accessed by its parent Client
 */
export function addSubClient(
  client: Client,
  subClient: Client,
  buildMethodPublic: boolean,
  parentAccessorPublic: boolean,
) {
  subClient.parent = client;
  subClient.buildMethodPublic = buildMethodPublic;
  subClient.parentAccessorPublic = parentAccessorPublic;
  client.subClients.push(subClient);
  subClient.language.java!.namespace = client.language.java!.namespace;
}

export interface ServiceVersion extends Metadata {}

export function createServiceVersion(
  name: string,
  description: string,
  options?: ModelOptions<ServiceVersion>,
): ServiceVersion {
  return createAspect(name, description, options);
}

export interface EncodedSchema {
  /**
   * The encoded type -- the type on wire.
   * E.g., the type for SDK maybe "int32", but type on wire be "string".
   */
  encode?: string;
}

export interface EncodedProperty {
  /**
   * The encoding of array items.
   * The type for SDK would "SdkArrayType" with a "valueType", the type on wire be "string".
   */
  arrayEncoding?: ArrayKnownEncoding;
}

export interface PageableContinuationToken {
  /**
   * The parameter of the operation as continuationToken in API request.
   */
  parameter: Parameter;
  // responseProperty and responseHeader is mutually exclusive
  /**
   * The reference to response body property of the operation as continuationToken in API request.
   * Array because the property may be at "links.nextToken".
   */
  responseProperty?: Array<Property>;
  /**
   * The reference to response header of the operation as continuationToken in API request.
   */
  responseHeader?: HttpHeader;
}

export function createPageableContinuationToken(
  parameter: Parameter,
  responseProperty?: Property[],
  responseHeader?: HttpHeader,
): PageableContinuationToken {
  return { parameter, responseProperty, responseHeader };
}

export interface Serializable {
  /**
   * The serialization format for the type or property.
   */
  serialization?: { xml?: XmlSerializationFormat };
}
