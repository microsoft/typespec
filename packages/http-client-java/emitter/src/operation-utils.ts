import { ObjectSchema, Parameter, Property, SchemaResponse } from "@autorest/codemodel";
import {
  SdkHttpOperation,
  SdkLroServiceMetadata,
  SdkModelPropertyType,
} from "@azure-tools/typespec-client-generator-core";
import { Operation, Program, Type, Union } from "@typespec/compiler";
import { HttpOperation } from "@typespec/http";
import { Client as CodeModelClient, ServiceVersion } from "./common/client.js";
import { CodeModel } from "./common/code-model.js";
import { Operation as CodeModelOperation } from "./common/operation.js";
import { getPropertySerializedName, modelIs, unionReferredByType } from "./type-utils.js";
import { getNamespace, pascalCase } from "./utils.js";

export const SPECIAL_HEADER_NAMES = new Set([
  "repeatability-request-id",
  "repeatability-first-sent",
  "x-ms-client-request-id",
  "client-request-id",
  "return-client-request-id",
]);

export const ORIGIN_API_VERSION = "modelerfour:synthesized/api-version";

export const CONTENT_TYPE_KEY = "content-type";

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

export function operationIsJsonMergePatch(op: SdkHttpOperation): boolean {
  return operationIsContentType(op, "application/merge-patch+json");
}

export function operationIsMultipart(op: SdkHttpOperation): boolean {
  return operationIsContentType(op, "multipart/form-data");
}

function operationIsContentType(op: SdkHttpOperation, contentType: string): boolean {
  for (const param of op.parameters) {
    if (param.kind === "header" && param.serializedName.toLowerCase() === CONTENT_TYPE_KEY) {
      if (param.type.kind === "constant" && param.type.value === contentType) {
        return true;
      }
    }
  }
  return false;
}

export function operationIsMultipleContentTypes(op: SdkHttpOperation): boolean {
  if (
    op.parameters &&
    op.parameters.some(
      (parameter) =>
        parameter.kind === "header" &&
        parameter.serializedName.toLowerCase() === CONTENT_TYPE_KEY &&
        parameter.type.kind === "enum",
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

export function isLroNewPollingStrategy(
  operation: SdkHttpOperation,
  lroMetadata: SdkLroServiceMetadata,
): boolean {
  let useNewStrategy = false;
  if (
    lroMetadata.pollingStep.responseBody &&
    modelIs(lroMetadata.pollingStep.responseBody, "OperationStatus", "Azure.Core.Foundations")
  ) {
    useNewStrategy = operationIs(operation, undefined, "Azure.Core");
  }

  if (!useNewStrategy) {
    // LroMetadata: following 2 pattern in LroMetadata requires new polling strategy, regardless whether they uses Azure.Core template
    if (operation.verb === "put" && !lroMetadata.finalStep) {
      // PUT without last GET on resource
      useNewStrategy = true;
    } else if (
      lroMetadata.finalStep &&
      lroMetadata.finalStep.kind === "pollingSuccessProperty" &&
      lroMetadata.finalResponse?.resultSegments
    ) {
      // final result is the value in lroMetadata.finalStep.target
      useNewStrategy = true;
    }
  }

  return useNewStrategy;
}

export function cloneOperationParameter(parameter: Parameter): Parameter {
  return new Parameter(
    parameter.language.default.name,
    parameter.language.default.description,
    parameter.schema,
    {
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
    },
  );
}

/**
 * Constructs a list of property path (json path) from the response schema based on the provided property segments.
 *
 * @param op the code model operation
 * @param propertySegments the segments of the property path (json path) to find in the response schema
 * @returns the list of property path (json path)
 */
export function findResponsePropertySegments(
  op: CodeModelOperation,
  propertySegments: SdkModelPropertyType[] | undefined,
): Property[] | undefined {
  if (op.responses && op.responses.length > 0 && op.responses[0] instanceof SchemaResponse) {
    const schema = op.responses[0].schema;
    if (propertySegments && schema instanceof ObjectSchema && schema.properties) {
      const propertyArray: Property[] = [];

      let currentSchemaProperties: Property[] | undefined = schema.properties;
      for (const propertySegment of propertySegments) {
        // abort if no properties in current schema. this should not happen though
        if (!currentSchemaProperties) {
          break;
        }

        // skip non-property segments. again, this should not happen
        if (propertySegment.kind === "property") {
          const serializedName = getPropertySerializedName(propertySegment);
          for (const property of currentSchemaProperties) {
            if (property.serializedName === serializedName) {
              propertyArray.push(property);

              currentSchemaProperties =
                property.schema instanceof ObjectSchema ? property.schema.properties : undefined;
            }
          }
        }
      }

      return propertyArray.length > 0 ? propertyArray : undefined;
    }
  }
  return undefined;
}

function operationIs(
  operation: SdkHttpOperation,
  name: string | undefined,
  namespace: string,
): boolean {
  let currentOp: Operation | undefined = operation.__raw.operation;
  while (currentOp) {
    if ((!name || currentOp.name === name) && getNamespace(currentOp) === namespace) {
      return true;
    }
    currentOp = currentOp.sourceOperation;
  }
  return false;
}
