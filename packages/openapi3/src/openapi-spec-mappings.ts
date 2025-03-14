import { AssetEmitter } from "@typespec/asset-emitter";
import { EmitContext, ModelProperty, Namespace, Program, Scalar } from "@typespec/compiler";
import { MetadataInfo } from "@typespec/http";
import { getExternalDocs, resolveInfo } from "@typespec/openapi";
import { JsonSchemaModule } from "./json-schema.js";
import { OpenAPI3EmitterOptions, OpenAPIVersion } from "./lib.js";
import {
  applyEncoding as applyEncoding3_0,
  getRawBinarySchema as getRawBinarySchema3_0,
  isRawBinarySchema as isRawBinarySchema3_0,
} from "./openapi-helpers-3-0.js";
import {
  applyEncoding as applyEncoding3_1,
  getRawBinarySchema as getRawBinarySchema3_1,
  isRawBinarySchema as isRawBinarySchema3_1,
} from "./openapi-helpers-3-1.js";
import { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { createSchemaEmitter3_0 } from "./schema-emitter-3-0.js";
import { createSchemaEmitter3_1 } from "./schema-emitter-3-1.js";
import { OpenAPI3Schema, OpenAPISchema3_1, SupportedOpenAPIDocuments } from "./types.js";
import { VisibilityUsageTracker } from "./visibility-usage.js";
import { XmlModule } from "./xml-module.js";

export type CreateSchemaEmitter = (props: {
  program: Program;
  context: EmitContext<OpenAPI3EmitterOptions>;
  metadataInfo: MetadataInfo;
  visibilityUsage: VisibilityUsageTracker;
  options: ResolvedOpenAPI3EmitterOptions;
  optionalDependencies: { jsonSchemaModule?: JsonSchemaModule; xmlModule?: XmlModule };
}) => AssetEmitter<OpenAPI3Schema | OpenAPISchema3_1, OpenAPI3EmitterOptions>;

export interface OpenApiSpecSpecificProps {
  applyEncoding(
    program: Program,
    typespecType: Scalar | ModelProperty,
    target: OpenAPI3Schema,
    options: ResolvedOpenAPI3EmitterOptions,
  ): OpenAPI3Schema & OpenAPISchema3_1;
  createRootDoc: (
    program: Program,
    serviceType: Namespace,
    serviceVersion?: string,
  ) => SupportedOpenAPIDocuments;

  createSchemaEmitter: CreateSchemaEmitter;
  /**
   * Returns the binary description for an unencoded binary type
   * @see https://spec.openapis.org/oas/v3.1.1.html#migrating-binary-descriptions-from-oas-3-0
   */
  getRawBinarySchema(contentType?: string): OpenAPI3Schema | OpenAPISchema3_1;

  isRawBinarySchema(schema: OpenAPI3Schema | OpenAPISchema3_1): boolean;
}

export function getOpenApiSpecProps(specVersion: OpenAPIVersion): OpenApiSpecSpecificProps {
  switch (specVersion) {
    case "3.0.0":
      return {
        applyEncoding: applyEncoding3_0,
        createRootDoc(program, serviceType, serviceVersion) {
          return createRoot(program, serviceType, specVersion, serviceVersion);
        },
        createSchemaEmitter: createSchemaEmitter3_0,
        getRawBinarySchema: getRawBinarySchema3_0,
        isRawBinarySchema: isRawBinarySchema3_0,
      };
    case "3.1.0":
      return {
        applyEncoding: applyEncoding3_1,
        createRootDoc(program, serviceType, serviceVersion) {
          return createRoot(program, serviceType, specVersion, serviceVersion);
        },
        createSchemaEmitter: createSchemaEmitter3_1,
        getRawBinarySchema: getRawBinarySchema3_1,
        isRawBinarySchema: isRawBinarySchema3_1,
      };
  }
}

function createRoot(
  program: Program,
  serviceType: Namespace,
  specVersion: OpenAPIVersion,
  serviceVersion?: string,
): SupportedOpenAPIDocuments {
  const info = resolveInfo(program, serviceType);

  return {
    openapi: specVersion,
    info: {
      title: "(title)",
      ...info,
      version: serviceVersion ?? info?.version ?? "0.0.0",
    },
    externalDocs: getExternalDocs(program, serviceType),
    tags: [],
    paths: {},
    security: undefined,
    components: {
      parameters: {},
      requestBodies: {},
      responses: {},
      schemas: {},
      examples: {},
      securitySchemes: {},
    },
  };
}
