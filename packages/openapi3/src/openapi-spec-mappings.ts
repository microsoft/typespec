import { Namespace, Program } from "@typespec/compiler";
import { TypeEmitter } from "@typespec/compiler/emitter-framework";
import { MetadataInfo } from "@typespec/http";
import { getExternalDocs, resolveInfo } from "@typespec/openapi";
import { OpenAPI3EmitterOptions, OpenAPIVersion } from "./lib.js";
import { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { createWrappedOpenAPI31SchemaEmitterClass } from "./schema-emitter-3-1.js";
import { createWrappedOpenAPI3SchemaEmitterClass } from "./schema-emitter.js";
import { SupportedOpenAPIDocuments } from "./types.js";
import { VisibilityUsageTracker } from "./visibility-usage.js";
import { XmlModule } from "./xml-module.js";

export interface OpenApiSpecSpecificProps {
  createRootDoc: (
    program: Program,
    serviceType: Namespace,
    serviceVersion?: string,
  ) => SupportedOpenAPIDocuments;

  /**
   * Creates a constructor for the schema emitter class for the given OpenAPI version.
   * This constructor is meant to be used when creating an AssetEmitter.
   */
  createSchemaEmitterCtor: (
    metadataInfo: MetadataInfo,
    visibilityUsage: VisibilityUsageTracker,
    options: ResolvedOpenAPI3EmitterOptions,
    xmlModule: XmlModule | undefined,
  ) => typeof TypeEmitter<Record<string, any>, OpenAPI3EmitterOptions>;
}

export function getOpenApiSpecProps(specVersion: OpenAPIVersion): OpenApiSpecSpecificProps {
  switch (specVersion) {
    case "3.0.0":
      return {
        createRootDoc(program, serviceType, serviceVersion) {
          return createRoot(program, serviceType, specVersion, serviceVersion);
        },
        createSchemaEmitterCtor: createWrappedOpenAPI3SchemaEmitterClass,
      };
    case "3.1.0":
      return {
        createRootDoc(program, serviceType, serviceVersion) {
          return createRoot(program, serviceType, specVersion, serviceVersion);
        },
        createSchemaEmitterCtor: createWrappedOpenAPI31SchemaEmitterClass,
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
