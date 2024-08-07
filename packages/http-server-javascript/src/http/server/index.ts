// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { ModelProperty, Type } from "@typespec/compiler";
import {
  HttpOperation,
  HttpOperationParameter,
  getHeaderFieldName,
  isBody,
  isHeader,
  isStatusCode,
} from "@typespec/http";
import { createOrGetModuleForNamespace } from "../../common/namespace.js";
import { emitTypeReference, isValueLiteralType } from "../../common/reference.js";
import { parseTemplateForScalar } from "../../common/scalar.js";
import {
  SerializableType,
  isSerializationRequired,
  requireSerialization,
} from "../../common/serialization/index.js";
import { Module, completePendingDeclarations, createModule } from "../../ctx.js";
import { parseCase } from "../../util/case.js";
import { UnimplementedError } from "../../util/error.js";
import { getAllProperties } from "../../util/extends.js";
import { bifilter, indent } from "../../util/iter.js";
import { keywordSafe } from "../../util/keywords.js";
import { HttpContext } from "../index.js";

import { module as routerHelpers } from "../../../generated-defs/helpers/router.js";
import { differentiateUnion, writeCodeTree } from "../../util/differentiate.js";

const DEFAULT_CONTENT_TYPE = "application/json";

/**
 * Emits raw operations for handling incoming server requests.
 *
 * @param ctx - The HTTP emitter context.
 * @param operationsModule - The module to emit the operations into.
 * @returns the module containing the raw server operations.
 */
export function emitRawServer(ctx: HttpContext, operationsModule: Module): Module {
  const serverRawModule = createModule("server-raw", operationsModule);

  serverRawModule.imports.push({
    binder: "* as http",
    from: "node:http",
  });

  serverRawModule.imports.push({
    binder: ["HttpContext"],
    from: routerHelpers,
  });

  for (const operation of ctx.httpService.operations) {
    serverRawModule.declarations.push([...emitRawServerOperation(ctx, operation, serverRawModule)]);
  }

  return serverRawModule;
}

/**
 * Emit a raw operation handler for a specific operation.
 * @param ctx - The HTTP emitter context.
 * @param operation - The operation to create a handler for.
 * @param module - The module that the handler will be written to.
 */
function* emitRawServerOperation(
  ctx: HttpContext,
  operation: HttpOperation,
  module: Module
): Iterable<string> {
  const op = operation.operation;
  const operationNameCase = parseCase(op.name);

  const container = op.interface ?? op.namespace!;
  const containerNameCase = parseCase(container.name);

  module.imports.push({
    binder: [containerNameCase.pascalCase],
    from: createOrGetModuleForNamespace(ctx, container.namespace!),
  });

  completePendingDeclarations(ctx);

  const pathParameters = operation.parameters.parameters.filter(function isPathParameter(param) {
    return param.type === "path";
  }) as Extract<HttpOperationParameter, { type: "path" }>[];

  const functionName = keywordSafe(containerNameCase.snakeCase + "_" + operationNameCase.snakeCase);

  yield `export async function ${functionName}(`;
  yield `  ctx: HttpContext,`;
  yield `  request: http.IncomingMessage,`;
  yield `  response: http.ServerResponse,`;
  yield `  operations: ${containerNameCase.pascalCase},`;

  for (const pathParam of pathParameters) {
    yield `  ${parseCase(pathParam.param.name).camelCase}: string,`;
  }

  yield "): Promise<void> {";

  const [_, parameters] = bifilter(op.parameters.properties.values(), (param) =>
    isValueLiteralType(param.type)
  );

  const queryParams: Extract<HttpOperationParameter, { type: "query" }>[] = [];

  const parsedParams = new Set<ModelProperty>();

  for (const parameter of operation.parameters.parameters) {
    const resolvedParameter =
      parameter.param.type.kind === "ModelProperty" ? parameter.param.type : parameter.param;
    switch (parameter.type) {
      case "header":
        yield* indent(emitHeaderParamBinding(ctx, parameter));
        break;
      case "query":
        queryParams.push(parameter);
        parsedParams.add(resolvedParameter);
        break;
      case "path":
        // Already handled above.
        parsedParams.add(resolvedParameter);
        break;
      default:
        throw new Error(
          `UNREACHABLE: parameter type ${
            (parameter satisfies never as HttpOperationParameter).type
          }`
        );
    }
  }

  if (queryParams.length > 0) {
    yield `  const __query_params = new URLSearchParams(request.url!.split("?", 1)[1] ?? "");`;
    yield "";
  }

  for (const qp of queryParams) {
    yield* indent(emitQueryParamBinding(ctx, qp));
  }

  const bodyFields = new Map<string, Type>(
    operation.parameters.body && operation.parameters.body.type.kind === "Model"
      ? getAllProperties(operation.parameters.body.type).map((p) => [p.name, p.type] as const)
      : []
  );

  let bodyName: string | undefined = undefined;

  if (operation.parameters.body) {
    const body = operation.parameters.body;

    if (body.contentTypes.length > 1) {
      throw new UnimplementedError("dynamic request content type");
    }

    const contentType = body.contentTypes[0] ?? DEFAULT_CONTENT_TYPE;

    const defaultBodyTypeName = operationNameCase.pascalCase + "RequestBody";

    if (body.bodyKind === "multipart") {
      throw new UnimplementedError(`new form of multipart requests`);
    }

    const bodyNameCase = parseCase(body.property?.name ?? defaultBodyTypeName);

    const bodyTypeName = emitTypeReference(
      ctx,
      body.type,
      body.property?.type ?? operation.operation.node,
      module,
      { altName: defaultBodyTypeName }
    );

    bodyName = bodyNameCase.camelCase;

    yield `  if (!request.headers["content-type"]?.startsWith(${JSON.stringify(contentType)})) {`;
    yield `    throw new Error(\`Invalid Request: expected content-type '${contentType}' but got '\${request.headers["content-type"]?.split(";", 2)[0]}'.\`)`;
    yield "  }";
    yield "";

    switch (contentType) {
      case "application/merge-patch+json":
      case "application/json": {
        requireSerialization(ctx, body.type as SerializableType, "application/json");
        yield `  const ${bodyName} = await new Promise(function parse${bodyNameCase.pascalCase}(resolve, reject) {`;
        yield `    const chunks: Array<Buffer> = [];`;
        yield `    request.on("data", function appendChunk(chunk) { chunks.push(chunk); });`;
        yield `    request.on("end", function finalize() {`;
        yield `      resolve(JSON.parse(Buffer.concat(chunks).toString()));`;
        yield `    });`;
        yield `  }) as ${bodyTypeName};`;
        yield "";

        break;
      }
      case "multipart/form-data":
        yield `const ${bodyName} = await new Promise(function parse${bodyNameCase.pascalCase}MultipartRequest(resolve, reject) {`;
        yield `  const boundary = request.headers["content-type"]?.split(";").find((s) => s.includes("boundary="))?.split("=", 2)[1];`;
        yield `  if (!boundary) {`;
        yield `      return reject("Invalid request: missing boundary in content-type.");`;
        yield `  }`;
        yield "";
        yield `  const chunks: Array<Buffer> = [];`;
        yield `  request.on("data", function appendChunk(chunk) { chunks.push(chunk); });`;
        yield `  request.on("end", function finalize() {`;
        yield `    const text = Buffer.concat(chunks).toString();`;
        yield `    const parts = text.split(boundary).slice(1, -1);`;
        yield `    const fields: { [k: string]: any } = {};`;
        yield "";
        yield `    for (const part of parts) {`;
        yield `      const [headerText, body] = part.split("\\r\\n\\r\\n", 2);`;
        yield "      const headers = Object.fromEntries(";
        yield `        headerText.split("\\r\\n").map((line) => line.split(": ", 2))`;
        yield "      ) as { [k: string]: string };";
        yield `      const name = headers["Content-Disposition"].split("name=\\"")[1].split("\\"")[0];`;
        yield `      const contentType = headers["Content-Type"] ?? "text/plain";`;
        yield "";
        yield `      switch (contentType) {`;
        yield `        case "application/json":`;
        yield `          fields[name] = JSON.parse(body);`;
        yield `          break;`;
        yield `        case "application/octet-stream":`;
        yield `          fields[name] = Buffer.from(body, "utf-8");`;
        yield `          break;`;
        yield `        default:`;
        yield `          fields[name] = body;`;
        yield `      }`;
        yield `    }`;
        yield "";
        yield `    resolve(fields as ${bodyTypeName});`;
        yield `  });`;
        yield `}) as ${bodyTypeName};`;
        break;
      default:
        throw new UnimplementedError(`request deserialization for content-type: '${contentType}'`);
    }

    yield "";
  }

  let hasOptions = false;
  const optionalParams = new Map<string, string>();

  const requiredParams = [];

  for (const param of parameters) {
    let paramBaseExpression;
    const paramNameCase = parseCase(param.name);
    const isBodyField = bodyFields.has(param.name) && bodyFields.get(param.name) === param.type;
    if (isBodyField) {
      paramBaseExpression = `${bodyName}.${paramNameCase.camelCase}`;
    } else {
      const resolvedParameter = param.type.kind === "ModelProperty" ? param.type : param;

      paramBaseExpression =
        resolvedParameter.type.kind === "Scalar" && parsedParams.has(resolvedParameter)
          ? parseTemplateForScalar(ctx, resolvedParameter.type).replace(
              "{}",
              paramNameCase.camelCase
            )
          : paramNameCase.camelCase;
    }

    if (param.optional) {
      hasOptions = true;
      optionalParams.set(paramNameCase.camelCase, paramBaseExpression);
    } else {
      requiredParams.push(paramBaseExpression);
    }
  }

  const paramLines = requiredParams.map((p) => `${p},`);

  if (hasOptions) {
    paramLines.push(
      `{ ${[...optionalParams.entries()].map(([name, expr]) => (name === expr ? name : `${name}: ${expr}`)).join(", ")} }`
    );
  }

  yield `  const result = await operations.${operationNameCase.camelCase}(ctx, `;
  yield* indent(indent(paramLines));
  yield `  );`, yield "";

  yield* indent(emitResultProcessing(ctx, op.returnType, module));

  yield "}";

  yield "";
}

/**
 * Emit the result-processing code for an operation.
 *
 * This code handles writing the result of calling the business logic layer to the HTTP response object.
 *
 * @param ctx - The HTTP emitter context.
 * @param t - The return type of the operation.
 * @param module - The module that the result processing code will be written to.
 */
function* emitResultProcessing(ctx: HttpContext, t: Type, module: Module): Iterable<string> {
  if (t.kind !== "Union") {
    // Single target type
    yield* emitResultProcessingForType(ctx, t, module);
  } else {
    const codeTree = differentiateUnion(ctx, t);

    yield* writeCodeTree(ctx, codeTree, {
      subject: "result",
      referenceModelProperty(p) {
        return "result." + parseCase(p.name).camelCase;
      },
      // We mapped the output directly in the code tree input, so we can just return it.
      renderResult: (t) => emitResultProcessingForType(ctx, t, module),
    });
  }
}

/**
 * Emit the result-processing code for a single response type.
 *
 * @param ctx - The HTTP emitter context.
 * @param target - The target type to emit processing code for.
 * @param module - The module that the result processing code will be written to.
 */
function* emitResultProcessingForType(
  ctx: HttpContext,
  target: Type,
  module: Module
): Iterable<string> {
  if (target.kind !== "Model") {
    throw new UnimplementedError(`result processing for type kind '${target.kind}'`);
  }

  const body = [...target.properties.values()].find((p) => isBody(ctx.program, p));

  for (const property of target.properties.values()) {
    if (isHeader(ctx.program, property)) {
      const headerName = getHeaderFieldName(ctx.program, property);
      yield `response.setHeader(${JSON.stringify(headerName.toLowerCase())}, result.${parseCase(property.name).camelCase});`;
      if (!body) yield `delete (result as any).${parseCase(property.name).camelCase};`;
    } else if (isStatusCode(ctx.program, property)) {
      yield `response.statusCode = result.${parseCase(property.name).camelCase};`;
      if (!body) yield `delete (result as any).${parseCase(property.name).camelCase};`;
    }
  }

  const allMetadataIsRemoved =
    !body &&
    [...target.properties.values()].every((p) => {
      return isHeader(ctx.program, p) || isStatusCode(ctx.program, p);
    });

  if (body) {
    const bodyCase = parseCase(body.name);
    const serializationRequired = isSerializationRequired(ctx, body.type, "application/json");
    requireSerialization(ctx, body.type, "application/json");
    if (serializationRequired) {
      const typeReference = emitTypeReference(ctx, body.type, body, module, {
        requireDeclaration: true,
      });
      yield `response.end(JSON.stringify(${typeReference}.toJsonObject(result.${bodyCase.camelCase})))`;
    } else {
      yield `response.end(JSON.stringify(result.${bodyCase.camelCase}));`;
    }
  } else {
    if (allMetadataIsRemoved) {
      yield `response.end();`;
    } else {
      const serializationRequired = isSerializationRequired(ctx, target, "application/json");
      requireSerialization(ctx, target, "application/json");
      if (serializationRequired) {
        const typeReference = emitTypeReference(ctx, target, target, module, {
          requireDeclaration: true,
        });
        yield `response.end(JSON.stringify(${typeReference}.toJsonObject(result as ${typeReference})));`;
      } else {
        yield `response.end(JSON.stringify(result));`;
      }
    }
  }
}

/**
 * Emit code that binds a given header parameter to a variable.
 *
 * If the parameter is not optional, this will also emit a test to ensure that the parameter is present.
 *
 * @param ctx - The HTTP emitter context.
 * @param parameter - The header parameter to bind.
 */
function* emitHeaderParamBinding(
  ctx: HttpContext,
  parameter: Extract<HttpOperationParameter, { type: "header" }>
): Iterable<string> {
  const nameCase = parseCase(parameter.param.name);

  // See https://nodejs.org/api/http.html#messageheaders
  // Apparently, only set-cookie can be an array.
  const canBeArrayType = parameter.name === "set-cookie";

  const assertion = canBeArrayType ? "" : " as string | undefined";

  yield `const ${nameCase.camelCase} = request.headers[${JSON.stringify(parameter.name)}]${assertion};`;

  if (!parameter.param.optional) {
    yield `if (${nameCase.camelCase} === undefined) {`;
    // prettier-ignore
    yield `  throw new Error("Invalid request: missing required header '${parameter.name}'.");`;
    yield "}";
    yield "";
  }
}

/**
 * Emit code that binds a given query parameter to a variable.
 *
 * If the parameter is not optional, this will also emit a test to ensure that the parameter is present.
 *
 * @param ctx - The HTTP emitter context
 * @param parameter - The query parameter to bind
 */
function* emitQueryParamBinding(
  ctx: HttpContext,
  parameter: Extract<HttpOperationParameter, { type: "query" }>
): Iterable<string> {
  const nameCase = parseCase(parameter.param.name);

  // UrlSearchParams annoyingly returns null for missing parameters instead of undefined.
  yield `const ${nameCase.camelCase} = __query_params.get(${JSON.stringify(parameter.name)}) ?? undefined;`;

  if (!parameter.param.optional) {
    yield `if (${nameCase.camelCase} === null) {`;
    // prettier-ignore
    yield `  throw new Error("Invalid request: missing required query parameter '${parameter.name}'.");`;
    yield "}";
    yield "";
  }
}
