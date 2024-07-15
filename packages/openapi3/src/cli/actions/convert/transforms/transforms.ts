import { OpenAPI3Document } from "../../../../types.js";
import {
  TypeSpecModel,
  TypeSpecNamespace,
  TypeSpecOperation,
  TypeSpecProgram,
  TypeSpecServiceInfo,
} from "../interfaces.js";
import { transformComponentParameters } from "./transform-component-parameters.js";
import { transformComponentSchemas } from "./transform-component-schemas.js";
import { transformAllOperationResponses } from "./transform-operation-responses.js";
import { transformPaths } from "./transform-paths.js";
import { transformServiceInfo } from "./transform-service-info.js";

export function transform(openapi: OpenAPI3Document): TypeSpecProgram {
  const models = collectModels(openapi);
  const operations = transformPaths(openapi.paths);

  return {
    serviceInfo: transformServiceInfo(openapi.info),
    ...populateProgramDeclarations(models, operations),
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
  // get models from #/paths/{route}/{httpMethod}/responses
  transformAllOperationResponses(models, document);

  return models;
}

function getFileNamespaceName(serviceInfo: TypeSpecServiceInfo): string {
  return serviceInfo.name.replaceAll(/[^\w^\d_]+/g, "");
}

type TypeSpecProgramDeclarations = Pick<TypeSpecProgram, "models" | "operations" | "namespaces">;
function populateProgramDeclarations(
  models: TypeSpecModel[],
  operations: TypeSpecOperation[]
): TypeSpecProgramDeclarations {
  // There can only be 1 file namespace - so if scopes is empty then entity belongs at root level
  const programDecs: TypeSpecProgramDeclarations = {
    models: [],
    operations: [],
    namespaces: {},
  };

  expandModels(programDecs, models);
  expandOperations(programDecs, operations);

  return programDecs;
}

function expandModels(programDecs: TypeSpecProgramDeclarations, models: TypeSpecModel[]): void {
  for (const model of models) {
    const { scope } = model;
    const namespace = getNamespace(programDecs, scope) ?? createNamespace(programDecs, scope);
    namespace.models.push(model);
  }
}

function expandOperations(
  programDecs: TypeSpecProgramDeclarations,
  operations: TypeSpecOperation[]
): void {
  for (const operation of operations) {
    const { scope } = operation;
    const namespace = getNamespace(programDecs, scope) ?? createNamespace(programDecs, scope);
    namespace.operations.push(operation);
  }
}

function getNamespace(
  programDecs: TypeSpecProgramDeclarations,
  scope: string[]
): TypeSpecNamespace | undefined {
  if (!scope.length) return programDecs;

  let namespace: TypeSpecNamespace = programDecs;
  for (const fragment of scope) {
    if (!namespace) return;
    namespace = namespace.namespaces[fragment];
  }

  return namespace;
}

function createNamespace(
  programDecs: TypeSpecProgramDeclarations,
  scope: string[]
): TypeSpecNamespace {
  let namespace: TypeSpecNamespace = programDecs;
  for (const fragment of scope) {
    if (!namespace.namespaces[fragment]) {
      namespace.namespaces[fragment] = {
        namespaces: {},
        models: [],
        operations: [],
      };
    }
    namespace = namespace.namespaces[fragment];
  }

  return namespace;
}
