import { TypeSpecModel, TypeSpecProgram } from "../interfaces.js";
import { Context } from "../utils/context.js";
import { transformComponentParameters } from "./transform-component-parameters.js";
import { transformComponentSchemas } from "./transform-component-schemas.js";
import { transformNamespaces } from "./transform-namespaces.js";
import { transformPaths } from "./transform-paths.js";
import { transformServiceInfo } from "./transform-service-info.js";

export function transform(context: Context): TypeSpecProgram {
  const openapi = context.openApi3Doc;
  const models = collectDataTypes(context);
  const operations = transformPaths(models, openapi.paths);

  return {
    serviceInfo: transformServiceInfo(openapi.info),
    ...transformNamespaces(models, operations),
    augmentations: [],
  };
}

function collectDataTypes(context: Context): TypeSpecModel[] {
  const models: TypeSpecModel[] = [];
  // get models from `#/components/schema
  transformComponentSchemas(context, models);
  // get models from `#/components/parameters
  transformComponentParameters(context, models);

  return models;
}
