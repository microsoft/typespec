import type OpenAPIParser from "@apidevtools/swagger-parser";
import { OpenAPI3Document, OpenAPI3Schema, Refable } from "../../../../types.js";
import { Logger } from "../../../types.js";
import { SchemaToExpressionGenerator } from "../generators/generate-types.js";
import { generateNamespaceName } from "./generate-namespace-name.js";

export interface Context {
  readonly openApi3Doc: OpenAPI3Document;
  readonly rootNamespace: string;
  readonly logger: Logger;

  generateTypeFromRefableSchema(schema: Refable<OpenAPI3Schema>, callingScope: string[]): string;
  getRefName(ref: string, callingScope: string[]): string;
  getSchemaByRef(ref: string): OpenAPI3Schema | undefined;
  getByRef<T>(ref: string): T | undefined;
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
    generateTypeFromRefableSchema(schema: Refable<OpenAPI3Schema>, callingScope: string[]) {
      return schemaExpressionGenerator.generateTypeFromRefableSchema(schema, callingScope);
    },
    getSchemaByRef(ref) {
      return this.getByRef(ref);
    },
    getByRef(ref) {
      return parser.$refs.get(ref) as any;
    },
  };

  return context;
}
