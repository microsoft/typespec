export type ExtensionKey = `x-${string}`;

export type Extensions = {
  [key in ExtensionKey]?: any;
};

export interface OpenAPI3Document extends Extensions {
  openapi: "3.0.0";
  info: OpenAPI3Info;
  paths: any;
  servers?: OpenAPI3Server[];
  externalDocs?: OpenAPI3ExternalDocs;
  tags?: OpenAPI3Tag[];
  components?: any;
}

export interface OpenAPI3Info extends Extensions {
  title: string;
  description?: string;
  termsOfService?: string;
  version: string;
}

export interface OpenAPI3Server {
  url: string;
  description?: string;
  variables?: Record<string, OpenAPI3ServerVariable>;
}

export interface OpenAPI3ServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface OpenAPI3ExternalDocs {
  url: string;
  description?: string;
}

export interface OpenAPI3Tag extends Extensions {
  name: string;
  description?: string;
  externalDocs?: OpenAPI3ExternalDocs;
}

export interface OpenAPI3Discriminator extends Extensions {
  propertyName: string;
  mapping?: Record<string, string>;
}

export type JsonType = "array" | "boolean" | "integer" | "number" | "object" | "string";

export type OpenAPI3Schema = Extensions & {
  type: JsonType;
  description?: string;
  properties?: Record<string, any>;
  required?: string[];
  discriminator?: OpenAPI3Discriminator;

  allOf?: any[];
  anyOf?: any[];
  oneOf?: any[];
};

export type OpenAPI3ParameterType = "header" | "query" | "path";
export type OpenAPI3Parameter = Extensions & {
  in: OpenAPI3ParameterType;
  schema: OpenAPI3Schema;
  name: string;
  required?: boolean;
  description?: string;
};

export type OpenAPI3Operation = Extensions & {
  description?: string;
  summary?: string;
  responses?: any;
  tags?: string[];
  operationId?: string;
  requestBody?: any;
  parameters: OpenAPI3Parameter[];
};
