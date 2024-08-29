import { OpenAPI3Document, OpenAPI3Schema, Refable } from "../../../../types.js";
import { SchemaToExpressionGenerator } from "../generators/generate-types.js";
import { generateNamespaceName } from "./generate-namespace-name.js";

export interface Context {
  readonly openApi3Doc: OpenAPI3Document;
  readonly rootNamespace: string;

  generateTypeFromRefableSchema(schema: Refable<OpenAPI3Schema>, callingScope: string[]): string;
  getRefName(ref: string, callingScope: string[]): string;
  getSchemaByRef(ref: string): OpenAPI3Schema | undefined;
}

export function createContext(openApi3Doc: OpenAPI3Document): Context {
  const rootNamespace = generateNamespaceName(openApi3Doc.info.title);
  const schemaExpressionGenerator = new SchemaToExpressionGenerator(rootNamespace);

  const context: Context = {
    openApi3Doc,
    rootNamespace,
    getRefName(ref: string, callingScope: string[]) {
      return schemaExpressionGenerator.getRefName(ref, callingScope);
    },
    generateTypeFromRefableSchema(schema: Refable<OpenAPI3Schema>, callingScope: string[]) {
      return schemaExpressionGenerator.generateTypeFromRefableSchema(schema, callingScope);
    },
    getSchemaByRef(ref) {
      const schemaName = ref.replace("#/components/schemas/", "");
      const schema = openApi3Doc.components?.schemas?.[schemaName];
      return schema;
    },
  };

  return context;
}
