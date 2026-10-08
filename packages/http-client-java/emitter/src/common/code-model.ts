import type { Client } from "./client.js";
import type { OperationGroup } from "./operation.js";
import type { Schemas } from "./schemas.js";
import { createSchemas } from "./schemas.js";
import type { Info, Metadata, ModelOptions, Parameter, Security } from "./schemas/model.js";
import { createInfo, createMetadata, createSecurity, initializeMetadata } from "./schemas/model.js";

/** the model that contains all the information required to generate a service api */
export interface CodeModel extends Metadata {
  /** Code model information */
  info: Info;

  /** All schemas for the model */
  schemas: Schemas;

  /** All operations  */
  operationGroups: Array<OperationGroup>;

  /** all global parameters (ie, ImplementationLocation = client ) */
  globalParameters?: Array<Parameter>;

  security: Security;

  clients: Array<Client>;

  arm?: boolean;

  apiVersionMap?: Record<string, string>;

  // cross-language metadata
  crossLanguagePackageId?: string;
  crossLanguageVersion?: string;
}

export function createCodeModel(
  title: string,
  options: Omit<ModelOptions<CodeModel>, "info"> & { info?: Partial<Info> } = {},
): CodeModel {
  return initializeMetadata<CodeModel>(
    {
      ...createMetadata(),
      info: createInfo(title),
      schemas: createSchemas(),
      operationGroups: [],
      security: createSecurity(false),
      clients: [],
    },
    { ...options, info: createInfo(title, options.info) },
  );
}

export function addGlobalParameter(model: CodeModel, parameter: Parameter): Parameter {
  const parameters = (model.globalParameters ??= []);
  parameters.push(parameter);
  parameters.sort(
    (a, b) =>
      (a.extensions?.["x-ms-priority"] ?? Number.MAX_VALUE) -
      (b.extensions?.["x-ms-priority"] ?? Number.MAX_VALUE),
  );
  return parameter;
}
