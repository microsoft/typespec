export type ExtensionKey = `x-${string}`;

export type Extensions = {
  [key in ExtensionKey]?: any;
};

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
