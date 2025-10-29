import {
  OpenAPI3Encoding,
  OpenAPIDocument3_1,
  Refable,
  SupportedOpenAPIDocuments,
  SupportedOpenAPISchema,
} from "../../../../types.js";
import { Logger } from "../../../types.js";
import { SchemaToExpressionGenerator } from "../generators/generate-types.js";
import { generateNamespaceName } from "./generate-namespace-name.js";

export interface Context {
  readonly openApi3Doc: SupportedOpenAPIDocuments;
  readonly rootNamespace: string;
  readonly logger: Logger;

  generateTypeFromRefableSchema(
    schema: Refable<SupportedOpenAPISchema>,
    callingScope: string[],
    isHttpPart?: boolean,
    encoding?: Record<string, OpenAPI3Encoding>,
  ): string;
  getRefName(ref: string, callingScope: string[]): string;
  getSchemaByRef(ref: string): SupportedOpenAPISchema | undefined;
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
    isUnionType: boolean,
  ): string;
}

export function createContext(
  openApi3Doc: SupportedOpenAPIDocuments,
  logger?: Logger,
  namespace?: string,
): Context {
  const rootNamespace = namespace
    ? generateNamespaceName(namespace)
    : generateNamespaceName(openApi3Doc.info.title);
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
      schema: Refable<SupportedOpenAPISchema>,
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
    getByRef<T>(ref: string): T | undefined {
      const splitRef = ref.split("/");
      const componentKind = splitRef[2]; // #/components/schemas/Pet -> components
      const componentName = splitRef[3]; // #/components/schemas/Pet -> Pet
      switch (componentKind) {
        case "schemas":
          return openApi3Doc.components?.schemas?.[componentName] as T;
        case "responses":
          return openApi3Doc.components?.responses?.[componentName] as T;
        case "parameters":
          return openApi3Doc.components?.parameters?.[componentName] as T;
        case "examples":
          return openApi3Doc.components?.examples?.[componentName] as T;
        case "requestBodies":
          return openApi3Doc.components?.requestBodies?.[componentName] as T;
        case "headers":
          return openApi3Doc.components?.headers?.[componentName] as T;
        case "securitySchemes":
          return openApi3Doc.components?.securitySchemes?.[componentName] as T;
        case "links":
          return openApi3Doc.components?.links?.[componentName] as T;
        case "callbacks":
          return (openApi3Doc as unknown as OpenAPIDocument3_1).components?.callbacks?.[
            componentName
          ] as T;
        default:
          this.logger.warn(`Unsupported component kind in $ref: ${ref}`);
          return undefined;
      }
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
      isUnionType: boolean,
    ): string {
      return schemaExpressionGenerator.getPartType(
        propType,
        name,
        isHttpPart,
        encoding,
        isEnumType,
        isUnionType,
      );
    },
  };

  return context;
}
