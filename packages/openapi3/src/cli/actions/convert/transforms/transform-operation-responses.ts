import { printIdentifier } from "@typespec/compiler";
import {
  OpenAPI3Header,
  OpenAPI3Responses,
  OpenAPI3Schema,
  OpenAPI3StatusCode,
  Refable,
} from "../../../../types.js";
import { TypeSpecDecorator, TypeSpecModel, TypeSpecModelProperty } from "../interfaces.js";
import { convertHeaderName } from "../utils/convert-header-name.js";
import { getDecoratorsForSchema, getExtensions } from "../utils/decorators.js";
import { getScopeAndName } from "../utils/get-scope-and-name.js";

/**
 * Transforms #/paths/{route}/{httpMethod}/responses into TypeSpec models.
 * @param operationId - Used to generate model names with scopes.
 * @param operationResponses - The responses object for an operation.
 */
export function collectOperationResponses(
  operationId: string,
  operationResponses: OpenAPI3Responses,
): TypeSpecModel[] {
  const models: TypeSpecModel[] = [];

  const rootDecorators: TypeSpecDecorator[] = getExtensions(operationResponses);
  for (const statusCode of Object.keys(operationResponses)) {
    const response = operationResponses[statusCode];
    const decorators: TypeSpecDecorator[] = [...rootDecorators];

    if ("$ref" in response) {
      //TODO: Support for referencing #/components/responseBodies
      continue;
    }

    // These headers will be applied to all of the models for this operation/statusCode
    const commonProperties: TypeSpecModelProperty[] = [];
    if (response.headers) {
      for (const name of Object.keys(response.headers)) {
        const property = convertHeaderToProperty(name, response.headers[name]);
        if (property) commonProperties.push(property);
      }
    }

    decorators.push(...getExtensions(response));

    // `default` status code is treated as the fallback for any status codes returned that aren't defined.
    if (statusCode === "default") {
      decorators.push({ name: "defaultResponse", args: [] });
    } else {
      commonProperties.push(convertStatusCodeToProperty(statusCode));
    }
    if (isErrorStatusCode(statusCode)) {
      decorators.push({ name: "error", args: [] });
    }

    const scopeAndName = getScopeAndName(operationId!);

    if (!response.content) {
      // This is common when there is no actual request body, just a statusCode, e.g. for errors
      models.push({
        kind: "model",
        scope: scopeAndName.scope,
        name: generateResponseModelName(scopeAndName.rawName, statusCode),
        decorators,
        properties: commonProperties,
        doc: response.description,
      });
    } else {
      // An operation may produce multiple content types, so need a model for each one.
      for (const contentType of Object.keys(response.content ?? {})) {
        const properties: TypeSpecModelProperty[] = [...commonProperties];
        const contentBody = response.content[contentType];

        // Wouldn't expect schema can be undefined since that implies contentType is not needed.
        if (contentBody.schema) {
          properties.push({
            name: "body",
            isOptional: false, // TODO: use the real value
            decorators: [{ name: "bodyRoot", args: [] }],
            schema: contentBody.schema,
          });
        }

        // Default is application/json, so it doesn't need to be specified
        if (contentType !== "application/json") {
          properties.push({
            name: "contentType",
            decorators: [{ name: "header", args: [] }],
            isOptional: false,
            schema: { type: "string", enum: [contentType] },
          });
        }

        models.push({
          kind: "model",
          scope: scopeAndName.scope,
          name: generateResponseModelName(scopeAndName.rawName, statusCode, contentType),
          decorators,
          properties,
          doc: response.description,
        });
      }
    }
  }

  return models;
}

function convertHeaderToProperty(
  name: string,
  meta: Refable<OpenAPI3Header>,
): TypeSpecModelProperty | undefined {
  const normalizedName = convertHeaderName(name);
  // TODO: handle style
  const headerDecorator: TypeSpecDecorator = { name: "header", args: [] };
  if (normalizedName !== name) {
    headerDecorator.args.push(name);
  }

  if ("$ref" in meta) {
    // Unhandled right now
    return;
  }

  return {
    name: normalizedName,
    decorators: [headerDecorator, ...getDecoratorsForSchema(meta.schema)],
    doc: meta.description ?? meta.schema.description,
    isOptional: !meta.required,
    schema: meta.schema,
  };
}

function convertStatusCodeToProperty(statusCode: OpenAPI3StatusCode): TypeSpecModelProperty {
  const schema: OpenAPI3Schema = { type: "integer", format: "int32" };
  if (statusCode === "1XX") {
    schema.minimum = 100;
    schema.maximum = 199;
  } else if (statusCode === "2XX") {
    schema.minimum = 200;
    schema.maximum = 299;
  } else if (statusCode === "3XX") {
    schema.minimum = 300;
    schema.maximum = 399;
  } else if (statusCode === "4XX") {
    schema.minimum = 400;
    schema.maximum = 499;
  } else if (statusCode === "5XX") {
    schema.minimum = 500;
    schema.maximum = 599;
  } else {
    const literalStatusCode = parseInt(statusCode, 10);
    if (!isValidLiteralStatusCode(literalStatusCode)) {
      // TODO: Emit warning or // FIXME
    } else {
      schema.enum = [literalStatusCode];
    }
  }
  return {
    name: "statusCode",
    schema,
    decorators: [{ name: "statusCode", args: [] }],
    isOptional: false,
  };
}

function isValidLiteralStatusCode(statusCode: number): boolean {
  return isFinite(statusCode) && statusCode >= 100 && statusCode <= 599;
}

function isErrorStatusCode(statusCode: OpenAPI3StatusCode): boolean {
  if (["1XX", "2XX", "3XX", "default"].includes(statusCode)) {
    return false;
  } else if (["4XX", "5XX"].includes(statusCode)) {
    return true;
  }

  const literalStatusCode = parseInt(statusCode, 10);
  return isFinite(literalStatusCode) && literalStatusCode >= 400;
}

export function generateResponseModelName(
  operationId: string,
  statusCode: string,
  contentType?: string,
): string {
  if (statusCode === "default") {
    statusCode = "Default";
  }
  let modelName = `${operationId}${statusCode}`;
  if (contentType) {
    modelName += convertContentType(contentType);
  }
  return printIdentifier(modelName + "Response");
}

function convertContentType(contentType: string): string {
  return contentType
    .replaceAll("*", "Star")
    .split("/")
    .map((s) => s.substring(0, 1).toUpperCase() + s.substring(1))
    .join("");
}
