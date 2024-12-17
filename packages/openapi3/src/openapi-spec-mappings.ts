import { EmitContext, Namespace, Program } from "@typespec/compiler";
import { AssetEmitter } from "@typespec/compiler/emitter-framework";
import { MetadataInfo } from "@typespec/http";
import { getExternalDocs, resolveInfo } from "@typespec/openapi";
import { JsonSchemaModule } from "./json-schema-module.js";
import { OpenAPI3EmitterOptions, OpenAPIVersion } from "./lib.js";
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
  xmlModule: XmlModule | undefined;
  jsonSchemaModule: JsonSchemaModule | undefined;
}) => AssetEmitter<OpenAPI3Schema | OpenAPISchema3_1, OpenAPI3EmitterOptions>;

export interface OpenApiSpecSpecificProps {
  createRootDoc: (
    program: Program,
    serviceType: Namespace,
    serviceVersion?: string,
  ) => SupportedOpenAPIDocuments;

  createSchemaEmitter: CreateSchemaEmitter;
}

export function getOpenApiSpecProps(specVersion: OpenAPIVersion): OpenApiSpecSpecificProps {
  switch (specVersion) {
    case "3.0.0":
      return {
        createRootDoc(program, serviceType, serviceVersion) {
          return createRoot(program, serviceType, specVersion, serviceVersion);
        },
        createSchemaEmitter: createSchemaEmitter3_0,
      };
    case "3.1.0":
      return {
        createRootDoc(program, serviceType, serviceVersion) {
          return createRoot(program, serviceType, specVersion, serviceVersion);
        },
        createSchemaEmitter: createSchemaEmitter3_1,
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
