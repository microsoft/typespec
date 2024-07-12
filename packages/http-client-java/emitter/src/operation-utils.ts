import {
  ModelProperty,
  Operation,
  Program,
  Type,
  Union,
  ignoreDiagnostics,
  projectProgram,
  resolvePath,
} from "@typespec/compiler";
import {
  HttpOperation,
  getHeaderFieldName,
  getQueryParamName,
  getPathParamName,
  isStatusCode,
  getAllHttpServices,
  getHttpService,
} from "@typespec/http";
import { resolveOperationId } from "@typespec/openapi";
import { Parameter } from "@autorest/codemodel";
import { LroMetadata } from "@azure-tools/typespec-azure-core";
import { buildVersionProjections } from "@typespec/versioning";
import { Client as CodeModelClient, ServiceVersion } from "./common/client.js";
import { CodeModel } from "./common/code-model.js";
import { EmitterOptions } from "./emitter.js";
import { getNamespace, logWarning, pascalCase } from "./utils.js";
import { modelIs, unionReferredByType } from "./type-utils.js";
import { SdkContext, getDefaultApiVersion } from "@azure-tools/typespec-client-generator-core";
import { pathToFileURL } from "url";

export const SPECIAL_HEADER_NAMES = new Set([
  "repeatability-request-id",
  "repeatability-first-sent",
  "x-ms-client-request-id",
  "client-request-id",
  "return-client-request-id",
]);

export const ORIGIN_API_VERSION = "modelerfour:synthesized/api-version";

const CONTENT_TYPE_KEY = "content-type";

// azure-core SerializerEncoding.SUPPORTED_MIME_TYPES
const SUPPORTED_MIME_TYPES = new Set<string>([
  "text/xml",
  "application/xml",
  "application/json",
  "text/css",
  "text/csv",
  "text/html",
  "text/javascript",
  "text/plain",
  // not in azure-core
  "application/merge-patch+json",
]);

export function isKnownContentType(contentTypes: string[]): boolean {
  return contentTypes
    .map((it) => it.toLowerCase())
    .some((it) => {
      return SUPPORTED_MIME_TYPES.has(it);
    });
}

/**
 * Load examples from the examples directory.
 *
 * @param program the program.
 * @param options the emitter options.
 * @param sdkContext the SdkContext.
 * @returns the Map of Operation to JSON. The Operation would be operation.projectionSource if available.
 */
export async function loadExamples(
  program: Program,
  options: EmitterOptions,
  sdkContext: SdkContext,
): Promise<Map<Operation, any>> {
  // sdkContextApiVersion could contain "all" or "latest"
  const sdkContextApiVersion = sdkContext.apiVersion;

  const operationExamplesMap = new Map<Operation, any>();
  const operationExamplesDirectory = options["examples-directory"];
  if (operationExamplesDirectory) {
    const operationIdExamplesMap = new Map<string, any>();

    let service = ignoreDiagnostics(getAllHttpServices(program))[0];
    let version = undefined;
    if (sdkContextApiVersion && !["all", "latest"].includes(sdkContextApiVersion)) {
      version = sdkContextApiVersion;
    } else {
      version = getDefaultApiVersion(sdkContext, service.namespace)?.value;
    }
    if (version) {
      // projection
      const versionProjections = buildVersionProjections(program, service.namespace).filter(
        (it) => it.version === version,
      );
      const projectedProgram = projectProgram(program, versionProjections[0].projections);
      const projectedService = projectedProgram.projector.projectedTypes.get(service.namespace);
      if (projectedService?.kind === "Namespace") {
        service = ignoreDiagnostics(getHttpService(program, projectedService));
      }
    }

    let exampleDir = version
      ? resolvePath(operationExamplesDirectory, version)
      : resolvePath(operationExamplesDirectory);
    if (!(await directoryExists(program, exampleDir))) {
      if (program.projectRoot) {
        // try resolve "examples-directory" relative to program.projectRoot
        exampleDir = version
          ? resolvePath(program.projectRoot, operationExamplesDirectory, version)
          : resolvePath(program.projectRoot, operationExamplesDirectory);
        if (!(await directoryExists(program, exampleDir))) {
          logWarning(program, `Examples directory '${exampleDir}' does not exist.`);
          return operationExamplesMap;
        }
      }
    }
    const exampleFiles = await program.host.readDir(exampleDir);
    for (const fileName of exampleFiles) {
      try {
        const exampleFilePath = resolvePath(exampleDir, fileName);
        const exampleFile = await program.host.readFile(exampleFilePath);
        const example = JSON.parse(exampleFile.text);
        if (!example.operationId) {
          logWarning(program, `Example file '${fileName}' is missing operationId.`);
          continue;
        }

        if (!operationIdExamplesMap.has(example.operationId)) {
          example["x-ms-original-file"] = pathToFileURL(exampleFilePath).toString();
          operationIdExamplesMap.set(example.operationId, example);
        }
      } catch (err) {
        logWarning(program, `Failed to load example file '${fileName}'.`);
      }
    }

    if (operationIdExamplesMap.size > 0) {
      const routes = service.operations;
      routes.forEach((it) => {
        const operationId = pascalCaseForOperationId(resolveOperationId(program, it.operation));
        if (operationIdExamplesMap.has(operationId)) {
          let operation = it.operation;
          if (operation.projectionSource?.kind === "Operation") {
            operation = operation.projectionSource;
          }
          operationExamplesMap.set(operation, operationIdExamplesMap.get(operationId));
        }
      });
    }
  }
  return operationExamplesMap;
}

async function directoryExists(program: Program, directory: string) {
  try {
    if (!(await program.host.stat(directory)).isDirectory()) {
      return false;
    }
  } catch (err) {
    return false;
  }
  return true;
}

function pascalCaseForOperationId(name: string) {
  return name
    .split("_")
    .map((s) => pascalCase(s))
    .join("_");
}

export function operationIsJsonMergePatch(op: HttpOperation): boolean {
  return operationIsContentType(op, "application/merge-patch+json");
}

export function operationIsMultipart(op: HttpOperation): boolean {
  return operationIsContentType(op, "multipart/form-data");
}

function operationIsContentType(op: HttpOperation, contentType: string): boolean {
  for (const param of op.parameters.parameters) {
    if (param.type === "header" && param.name.toLowerCase() === CONTENT_TYPE_KEY) {
      if (param.param.type.kind === "String" && param.param.type.value === contentType) {
        return true;
      }
    }
  }
  return false;
}

export function operationIsMultipleContentTypes(op: HttpOperation): boolean {
  if (
    op.parameters.parameters &&
    op.parameters.parameters.some(
      (parameter) =>
        parameter?.type === "header" &&
        parameter?.name?.toLowerCase() === CONTENT_TYPE_KEY &&
        parameter?.param?.type?.kind === "Union",
    )
  ) {
    return true;
  }
  return false;
}

export function operationRefersUnion(
  program: Program,
  op: HttpOperation,
  cache: Map<Type, Union | null | undefined>,
): Union | null {
  // request parameters
  for (const parameter of op.parameters.parameters) {
    const ret = unionReferredByType(program, parameter.param.type, cache);
    if (ret) {
      return ret;
    }
  }
  // request body
  if (op.parameters.body) {
    if (op.parameters.body.property) {
      const ret = unionReferredByType(program, op.parameters.body.property.type, cache);
      if (ret) {
        return ret;
      }
    } else if (op.parameters.body.type) {
      const ret = unionReferredByType(program, op.parameters.body.type, cache);
      if (ret) {
        return ret;
      }
    }
  }
  // response body
  if (op.responses && op.responses.length > 0 && op.responses[0].type) {
    const ret = unionReferredByType(program, op.responses[0].type, cache);
    if (ret) {
      return ret;
    }
  }
  // TODO (weidxu): LRO response
  return null;
}

export function isPayloadProperty(program: Program, property: ModelProperty | undefined): boolean {
  if (property === undefined) {
    return false;
  }
  const headerInfo = getHeaderFieldName(program, property);
  const queryInfo = getQueryParamName(program, property);
  const pathInfo = getPathParamName(program, property);
  const statusCodeInfo = isStatusCode(program, property);
  return !(headerInfo || queryInfo || pathInfo || statusCodeInfo);
}

export function getServiceVersion(client: CodeModelClient | CodeModel): ServiceVersion {
  let name = client.language.default.name;
  let description = name;
  name = pascalCase(name);
  if (name.endsWith("Client")) {
    name = name.substring(0, name.length - "Client".length);
  } else {
    description = description + "Client";
  }
  if (name.endsWith("Service") && name !== "Service") {
    name = name + "Version";
  } else {
    name = name + "ServiceVersion";
  }
  return new ServiceVersion(name, description);
}

export function isLroNewPollingStrategy(httpOperation: HttpOperation, lroMetadata: LroMetadata): boolean {
  const operation = httpOperation.operation;
  let useNewStrategy = false;
  if (
    lroMetadata.pollingInfo &&
    lroMetadata.statusMonitorStep &&
    modelIs(lroMetadata.pollingInfo.responseModel, "OperationStatus", "Azure.Core.Foundations")
  ) {
    useNewStrategy = operationIs(operation, undefined, "Azure.Core");
  }

  if (!useNewStrategy) {
    // LroMetadata: following 2 pattern in LroMetadata requires new polling strategy, regardless whether they uses Azure.Core template
    if (httpOperation.verb === "put" && !lroMetadata.finalStep) {
      // PUT without last GET on resource
      useNewStrategy = true;
    } else if (
      lroMetadata.finalStep &&
      lroMetadata.finalStep.kind === "pollingSuccessProperty" &&
      lroMetadata.finalStep.target
    ) {
      // final result is the value in lroMetadata.finalStep.target
      useNewStrategy = true;
    }
  }

  return useNewStrategy;
}

export function cloneOperationParameter(parameter: Parameter): Parameter {
  return new Parameter(parameter.language.default.name, parameter.language.default.description, parameter.schema, {
    language: {
      default: {
        serializedName: parameter.language.default.serializedName,
      },
    },
    protocol: parameter.protocol,
    summary: parameter.summary,
    implementation: parameter.implementation,
    required: parameter.required,
    nullable: parameter.nullable,
    extensions: parameter.extensions,
  });
}

function operationIs(operation: Operation, name: string | undefined, namespace: string): boolean {
  let currentOp: Operation | undefined = operation;
  while (currentOp) {
    if ((!name || currentOp.name === name) && getNamespace(currentOp) === namespace) {
      return true;
    }
    currentOp = currentOp.sourceOperation;
  }
  return false;
}
