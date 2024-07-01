import { OpenAPI3Document } from "../../../../types.js";
import { TypeSpecModel, TypeSpecProgram } from "../interfaces.js";
import { transformComponentParameters } from "./transform-component-parameters.js";
import { transformComponentSchemas } from "./transform-component-schemas.js";
import { transformAllOperationResponses } from "./transform-operation-responses.js";
import { transformPaths } from "./transform-paths.js";
import { transformServiceInfo } from "./transform-service-info.js";

export function transform(openapi: OpenAPI3Document): TypeSpecProgram {
  const models = collectModels(openapi);

  return {
    serviceInfo: transformServiceInfo(openapi.info),
    models,
    augmentations: [],
    operations: transformPaths(openapi.paths),
  };
}

function collectModels(document: OpenAPI3Document): TypeSpecModel[] {
  const models: TypeSpecModel[] = [];
  const components = document.components;
  // get models from `#/components/schema
  transformComponentSchemas(models, components?.schemas);
  // get models from `#/components/parameters
  transformComponentParameters(models, components?.parameters);
  // get models from #/paths/{route}/{httpMethod}/responses
  transformAllOperationResponses(models, document);

  return models;
}
