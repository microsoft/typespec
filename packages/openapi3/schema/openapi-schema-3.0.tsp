/**
 * This document is used to specify the order of properties in the output Open API.
 * The order defined in the TypeSpec will be respected in the generated swagger.
 */
import "@typespec/json-schema";
import "@typespec/http";

using TypeSpec.Http;
using TypeSpec.JsonSchema;

namespace OpenAPISchema;

/** https://spec.openapis.org/oas/v3.0.3#openapi-object */
@jsonSchema
model OpenAPI_3_0_Schema {
  openapi: "3.0.0";

  /**
   * https://spec.openapis.org/oas/v3.0.3#info-object
   */
  info: Info;

  /** https://spec.openapis.org/oas/v3.0.3#server-object */
  servers?: Server[];

  /** https://spec.openapis.org/oas/v3.0.3#paths-object */
  paths: Record<PathItem>;

  /** https://spec.openapis.org/oas/v3.0.3#components-object */
  components?: Components;

  /** https://spec.openapis.org/oas/v3.0.3#security-requirement-object */
  security?: Record<string[]>[];

  /** https://spec.openapis.org/oas/v3.0.3#tag-object */
  tags: Tag[];
}

// ===== Shared
model Reference {
  $ref: string;
}

alias Refable<T> = Reference | T;

// ===== Info model
model Info {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
  version: string;
}

model Contact {
  name?: string;
  url?: string;
  email?: string;
}

model License {
  name: string;
  url?: string;
}

// ===== Server model
model Server {
  url: string;
  description?: string;
  variables?: Record<ServerVariable>;
}

model ServerVariable {
  `enum`?: string[];
  default: string;
  description?: string;
}

// ===== Paths model
model PathItem {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: Operation;
  put?: Operation;
  post?: Operation;
  patch?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  trace?: Operation;
  servers?: Server[];
  parameters?: Refable<Parameter[]>;
}

model Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocs;
  operationId?: string;
  parameters?: Parameter[];
  requestBody?: Refable<RequestBody>;
  responses: Record<Response>;

  /** Not implemented */
  callbacks?: unknown;

  deprecated?: boolean;
  security?: Record<string[]>[];
  servers: Server[];
}

model RequestBody {
  description?: string;
  content: Record<MediaType>;
  required?: boolean;
}

model MediaType {
  schema?: Refable<Schema>;
  example?: unknown;
  examples?: Record<Refable<Example>>;
  encoding?: Record<Encoding>;
}

model Example {
  summary?: string;
  description?: string;
  value?: unknown;
  externalValue?: string;
}

model Encoding {
  contentType?: string;
  headers?: Record<Refable<Header>>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

model Link {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<unknown>;
  requestBody?: Record<unknown>;
  description?: string;
  server?: Server;
}

model Header {
  in: "header";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
}

model Schema {}

union StatusCode {
  string,
  "1XX",
  "2XX",
  "3XX",
  "4XX",
  "5XX",
  "default",
}

model Response {
  description: string;
  headers?: Record<Refable<Header>>;
  content?: Record<MediaType>;
  links?: Record<Refable<Link>>;
}

model Parameter {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
}

model ExternalDocs {
  description?: string;
  url: string;
}

// ===== Components
model Components {
  schemas?: Record<Schema>;
  headers?: Record<Header>;
  responses?: Record<Response>;
  parameters?: Record<Parameter>;
  examples?: Record<Example>;
  requestBodies?: Record<RequestBody>;
  securitySchemes?: Record<SecurityScheme>;
  links?: Record<Link>;
}

model SecurityScheme {
  type: string;
  description?: string;
  name: string;
  in: string;
  scheme: string;
  bearerFormat?: string;
  flows: OAuthFlows;
  openIdConnectUrl: string;
}

model OAuthFlows {
  implicit: OAuthFlow;
  password: OAuthFlow;
  clientCredentials: OAuthFlow;
  authorizationCode: OAuthFlow;
}

model OAuthFlow {
  authorizationUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
  scopes: Record<string>;
}

// ===== Tag
model Tag {
  name: string;
  description?: string;
  externalDocs?: ExternalDocs;
}
