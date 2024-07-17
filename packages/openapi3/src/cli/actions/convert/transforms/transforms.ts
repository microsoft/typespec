import { OpenAPI3Document } from "../../../../types.js";
import { TypeSpecModel, TypeSpecProgram } from "../interfaces.js";
import { transformComponentParameters } from "./transform-component-parameters.js";
import { transformComponentSchemas } from "./transform-component-schemas.js";
import { transformNamespaces } from "./transform-namespaces.js";
import { transformPaths } from "./transform-paths.js";
import { transformServiceInfo } from "./transform-service-info.js";

export function transform(openapi: OpenAPI3Document): TypeSpecProgram {
  const models = collectModels(openapi);
  const operations = transformPaths(models, openapi.paths);

  return {
    serviceInfo: transformServiceInfo(openapi.info),
    ...transformNamespaces(models, operations),
    augmentations: [],
  };
}

function collectModels(document: OpenAPI3Document): TypeSpecModel[] {
  const models: TypeSpecModel[] = [];
  const components = document.components;
  // get models from `#/components/schema
  transformComponentSchemas(models, components?.schemas);
  // get models from `#/components/parameters
  transformComponentParameters(models, components?.parameters);

  return models;
}
