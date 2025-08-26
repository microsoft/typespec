import type OpenAPIParser from "@apidevtools/swagger-parser";
import { OpenAPI3Document, OpenAPI3Encoding, OpenAPI3Schema, Refable } from "../../../../types.js";
import { Logger } from "../../../types.js";
import { SchemaToExpressionGenerator } from "../generators/generate-types.js";
import { generateNamespaceName } from "./generate-namespace-name.js";

export interface Context {
  readonly openApi3Doc: OpenAPI3Document;
  readonly rootNamespace: string;
  readonly logger: Logger;

  generateTypeFromRefableSchema(
    schema: Refable<OpenAPI3Schema>,
    callingScope: string[],
    isHttpPart?: boolean,
    encoding?: Record<string, OpenAPI3Encoding>,
  ): string;
  getRefName(ref: string, callingScope: string[]): string;
  getSchemaByRef(ref: string): OpenAPI3Schema | undefined;
  getByRef<T>(ref: string): T | undefined;

  /**
   * Register a schema as being used in a multipart form context with encoding information.
   * This allows the schema generator to wrap properties with HttpPart when generating the schema definition.
   */
  registerMultipartSchema(ref: string, encoding?: Record<string, OpenAPI3Encoding>): void;

  /**
   * Get the encoding registered for the component schema if any.
   */
  getMultipartSchemaEncoding(ref: string): Record<string, OpenAPI3Encoding> | undefined;
  /**
   * Checks whether a component schema is registered for multipart forms.
   */
  isSchemaReferenceRegisteredForMultipartForm(ref: string): boolean;
  /**
   * Get the type to use for a property that may be an http part.
   * If the property is an http part, it will be wrapped in HttpPart<...>.
   */
  getPartType(
    propType: string,
    name: string,
    isHttpPart: boolean,
    encoding: Record<string, OpenAPI3Encoding> | undefined,
    isEnumType: boolean,
  ): string;
}

export type Parser = {
  $refs: OpenAPIParser["$refs"];
};

export function createContext(
  parser: Parser,
  openApi3Doc: OpenAPI3Document,
  logger?: Logger,
): Context {
  const rootNamespace = generateNamespaceName(openApi3Doc.info.title);
  const schemaExpressionGenerator = new SchemaToExpressionGenerator(rootNamespace);

  // Track schemas that are used in multipart forms with their encoding information
  const multipartSchemas = new Map<string, Record<string, OpenAPI3Encoding> | null>();

  // Create a default no-op logger if none provided
  const defaultLogger: Logger = {
    trace: () => {},
    warn: () => {},
    error: () => {},
  };

  const context: Context = {
    openApi3Doc,
    rootNamespace,
    logger: logger ?? defaultLogger,
    getRefName(ref: string, callingScope: string[]) {
      return schemaExpressionGenerator.getRefName(ref, callingScope);
    },
    generateTypeFromRefableSchema(
      schema: Refable<OpenAPI3Schema>,
      callingScope: string[],
      isHttpPart = false,
      encoding?: Record<string, OpenAPI3Encoding>,
    ) {
      return schemaExpressionGenerator.generateTypeFromRefableSchema(
        schema,
        callingScope,
        isHttpPart,
        encoding,
        this,
      );
    },
    getSchemaByRef(ref) {
      return this.getByRef(ref);
    },
    getByRef(ref) {
      return parser.$refs.get(ref) as any;
    },
    registerMultipartSchema(ref: string, encoding?: Record<string, OpenAPI3Encoding>) {
      multipartSchemas.set(ref, encoding ?? null);
    },
    getMultipartSchemaEncoding(ref: string) {
      const result = multipartSchemas.get(ref);
      return result === null ? undefined : result;
    },
    isSchemaReferenceRegisteredForMultipartForm(ref: string): boolean {
      return multipartSchemas.has(ref);
    },
    getPartType(
      propType: string,
      name: string,
      isHttpPart: boolean,
      encoding: Record<string, OpenAPI3Encoding> | undefined,
      isEnumType: boolean,
    ): string {
      return schemaExpressionGenerator.getPartType(
        propType,
        name,
        isHttpPart,
        encoding,
        isEnumType,
      );
    },
  };

  return context;
}
