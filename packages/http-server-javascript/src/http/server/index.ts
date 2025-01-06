// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { ModelProperty, Type, compilerAssert } from "@typespec/compiler";
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
import { isUnspeakable, parseCase } from "../../util/case.js";
import { UnimplementedError } from "../../util/error.js";
import { getAllProperties } from "../../util/extends.js";
import { bifilter, indent } from "../../util/iter.js";
import { keywordSafe } from "../../util/keywords.js";
import { HttpContext } from "../index.js";

import { module as routerHelpers } from "../../../generated-defs/helpers/router.js";
import { reportDiagnostic } from "../../lib.js";
import { differentiateUnion, writeCodeTree } from "../../util/differentiate.js";
import { emitMultipart, emitMultipartLegacy } from "./multipart.js";

import { module as headerHelpers } from "../../../generated-defs/helpers/header.js";
import { requiresJsonSerialization } from "../../common/serialization/json.js";

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
  module: Module,
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

  const names: Names = {
    ctx: ctx.gensym("ctx"),
    result: ctx.gensym("result"),
    operations: ctx.gensym("operations"),
    queryParams: ctx.gensym("queryParams"),
  };

  yield `export async function ${functionName}(`;
  yield `  ${names.ctx}: HttpContext,`;
  yield `  ${names.operations}: ${containerNameCase.pascalCase},`;

  for (const pathParam of pathParameters) {
    yield `  ${parseCase(pathParam.param.name).camelCase}: string,`;
  }

  yield "): Promise<void> {";

  const [_, parameters] = bifilter(op.parameters.properties.values(), (param) =>
    isValueLiteralType(param.type),
  );

  const queryParams: Extract<HttpOperationParameter, { type: "query" }>[] = [];

  const parsedParams = new Set<ModelProperty>();

  for (const parameter of operation.parameters.parameters) {
    const resolvedParameter =
      parameter.param.type.kind === "ModelProperty" ? parameter.param.type : parameter.param;
    switch (parameter.type) {
      case "header":
        yield* indent(emitHeaderParamBinding(ctx, operation, names, parameter));
        break;
      case "cookie":
        throw new UnimplementedError("cookie parameters");
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
          }`,
        );
    }
  }

  if (queryParams.length > 0) {
    yield `  const ${names.queryParams} = new URLSearchParams(${names.ctx}.request.url!.split("?", 2)[1] ?? "");`;
    yield "";
  }

  for (const qp of queryParams) {
    yield* indent(emitQueryParamBinding(ctx, operation, names, qp));
  }

  const bodyFields = new Map<string, Type>(
    operation.parameters.body && operation.parameters.body.type.kind === "Model"
      ? getAllProperties(operation.parameters.body.type).map((p) => [p.name, p.type] as const)
      : [],
  );

  let bodyName: string | undefined = undefined;

  if (operation.parameters.body) {
    const body = operation.parameters.body;

    if (body.contentTypes.length > 1) {
      reportDiagnostic(ctx.program, {
        code: "dynamic-request-content-type",
        target: operation.operation,
      });
    }

    const contentType = body.contentTypes[0] ?? DEFAULT_CONTENT_TYPE;

    const defaultBodyTypeName = operationNameCase.pascalCase + "RequestBody";

    const bodyNameCase = parseCase(body.property?.name ?? defaultBodyTypeName);

    const bodyTypeName = emitTypeReference(
      ctx,
      body.type,
      body.property?.type ?? operation.operation.node,
      module,
      { altName: defaultBodyTypeName },
    );

    bodyName = ctx.gensym(bodyNameCase.camelCase);

    module.imports.push({ binder: ["parseHeaderValueParameters"], from: headerHelpers });

    const contentTypeHeader = ctx.gensym("contentType");

    yield `  const ${contentTypeHeader} = parseHeaderValueParameters(${names.ctx}.request.headers["content-type"] as string | undefined);`;

    yield `  if (${contentTypeHeader}?.value !== ${JSON.stringify(contentType)}) {`;

    yield `    return ${names.ctx}.errorHandlers.onInvalidRequest(`;
    yield `      ${names.ctx},`;
    yield `      ${JSON.stringify(operation.path)},`;
    yield `      \`unexpected "content-type": '\${${contentTypeHeader}?.value}', expected '${JSON.stringify(contentType)}'\``;
    yield `    );`;

    yield "  }";
    yield "";

    switch (contentType) {
      case "application/merge-patch+json":
      case "application/json": {
        requireSerialization(ctx, body.type as SerializableType, "application/json");
        yield `  const ${bodyName} = await new Promise(function parse${bodyNameCase.pascalCase}(resolve, reject) {`;
        yield `    const chunks: Array<Buffer> = [];`;
        yield `    ${names.ctx}.request.on("data", function appendChunk(chunk) { chunks.push(chunk); });`;
        yield `    ${names.ctx}.request.on("end", function finalize() {`;
        yield `      try {`;
        yield `        const body = Buffer.concat(chunks).toString();`;

        let value: string;

        if (requiresJsonSerialization(ctx, body.type)) {
          value = `${bodyTypeName}.fromJsonObject(JSON.parse(body))`;
        } else {
          value = `JSON.parse(body)`;
        }

        yield `        resolve(${value});`;
        yield `      } catch {`;
        yield `        ${names.ctx}.errorHandlers.onInvalidRequest(`;
        yield `          ${names.ctx},`;
        yield `          ${JSON.stringify(operation.path)},`;
        yield `          "invalid JSON in request body",`;
        yield `        );`;
        yield `        reject();`;
        yield `      }`;
        yield `    });`;
        yield `    ${names.ctx}.request.on("error", reject);`;
        yield `  }) as ${bodyTypeName};`;
        yield "";

        break;
      }
      case "multipart/form-data":
        if (body.bodyKind === "multipart") {
          yield* indent(
            emitMultipart(ctx, module, operation, body, names.ctx, bodyName, bodyTypeName),
          );
        } else {
          yield* indent(emitMultipartLegacy(names.ctx, bodyName, bodyTypeName));
        }
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
    const isBodyExact = operation.parameters.body?.property === param;
    if (isBodyField) {
      paramBaseExpression = `${bodyName}.${paramNameCase.camelCase}`;
    } else if (isBodyExact) {
      paramBaseExpression = bodyName!;
    } else {
      const resolvedParameter = param.type.kind === "ModelProperty" ? param.type : param;

      paramBaseExpression =
        resolvedParameter.type.kind === "Scalar" && parsedParams.has(resolvedParameter)
          ? parseTemplateForScalar(ctx, resolvedParameter.type).replace(
              "{}",
              paramNameCase.camelCase,
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
      `{ ${[...optionalParams.entries()].map(([name, expr]) => (name === expr ? name : `${name}: ${expr}`)).join(", ")} }`,
    );
  }

  yield `  const ${names.result} = await ${names.operations}.${operationNameCase.camelCase}(${names.ctx}, `;
  yield* indent(indent(paramLines));
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  yield `  );`, yield "";

  yield* indent(emitResultProcessing(ctx, names, op.returnType, module));

  yield "}";

  yield "";
}

interface Names {
  ctx: string;
  result: string;
  operations: string;
  queryParams: string;
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
function* emitResultProcessing(
  ctx: HttpContext,
  names: Names,
  t: Type,
  module: Module,
): Iterable<string> {
  if (t.kind !== "Union") {
    // Single target type
    yield* emitResultProcessingForType(ctx, names, t, module);
  } else {
    const codeTree = differentiateUnion(ctx, t);

    yield* writeCodeTree(ctx, codeTree, {
      subject: names.result,
      referenceModelProperty(p) {
        return names.result + "." + parseCase(p.name).camelCase;
      },
      // We mapped the output directly in the code tree input, so we can just return it.
      renderResult: (t) => emitResultProcessingForType(ctx, names, t, module),
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
  names: Names,
  target: Type,
  module: Module,
): Iterable<string> {
  if (target.kind !== "Model") {
    throw new UnimplementedError(`result processing for type kind '${target.kind}'`);
  }

  const body = [...target.properties.values()].find((p) => isBody(ctx.program, p));

  for (const property of target.properties.values()) {
    if (isHeader(ctx.program, property)) {
      const headerName = getHeaderFieldName(ctx.program, property);
      yield `${names.ctx}.response.setHeader(${JSON.stringify(headerName.toLowerCase())}, ${names.result}.${parseCase(property.name).camelCase});`;
      if (!body) yield `delete (${names.result} as any).${parseCase(property.name).camelCase};`;
    } else if (isStatusCode(ctx.program, property)) {
      if (isUnspeakable(property.name)) {
        if (!isValueLiteralType(property.type)) {
          reportDiagnostic(ctx.program, {
            code: "unspeakable-status-code",
            target: property,
            format: {
              name: property.name,
            },
          });
          continue;
        }

        compilerAssert(property.type.kind === "Number", "Status code must be a number.");

        yield `${names.ctx}.response.statusCode = ${property.type.valueAsString};`;
      } else {
        yield `${names.ctx}.response.statusCode = ${names.result}.${parseCase(property.name).camelCase};`;
        if (!body) yield `delete (${names.result} as any).${parseCase(property.name).camelCase};`;
      }
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

    yield `${names.ctx}.response.setHeader("content-type", "application/json");`;

    if (serializationRequired) {
      const typeReference = emitTypeReference(ctx, body.type, body, module, {
        requireDeclaration: true,
      });
      yield `${names.ctx}.response.end(JSON.stringify(${typeReference}.toJsonObject(${names.result}.${bodyCase.camelCase})))`;
    } else {
      yield `${names.ctx}.response.end(JSON.stringify(${names.result}.${bodyCase.camelCase}));`;
    }
  } else {
    if (allMetadataIsRemoved) {
      yield `${names.ctx}.response.end();`;
    } else {
      const serializationRequired = isSerializationRequired(ctx, target, "application/json");
      requireSerialization(ctx, target, "application/json");

      yield `${names.ctx}.response.setHeader("content-type", "application/json");`;

      if (serializationRequired) {
        const typeReference = emitTypeReference(ctx, target, target, module, {
          requireDeclaration: true,
        });
        yield `${names.ctx}.response.end(JSON.stringify(${typeReference}.toJsonObject(${names.result} as ${typeReference})));`;
      } else {
        yield `${names.ctx}.response.end(JSON.stringify(${names.result}));`;
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
  operation: HttpOperation,
  names: Names,
  parameter: Extract<HttpOperationParameter, { type: "header" }>,
): Iterable<string> {
  const nameCase = parseCase(parameter.param.name);
  const headerName = parameter.name.toLowerCase();

  // See https://nodejs.org/api/http.html#messageheaders
  // Apparently, only set-cookie can be an array.
  const canBeArrayType = parameter.name === "set-cookie";

  const assertion = canBeArrayType ? "" : " as string | undefined";

  yield `const ${nameCase.camelCase} = ${names.ctx}.request.headers[${JSON.stringify(headerName)}]${assertion};`;

  if (!parameter.param.optional) {
    yield `if (${nameCase.camelCase} === undefined) {`;
    // prettier-ignore
    yield `  return ${names.ctx}.errorHandlers.onInvalidRequest(${names.ctx}, ${JSON.stringify(operation.path)}, "missing required header '${headerName}'");`;
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
  operation: HttpOperation,
  names: Names,
  parameter: Extract<HttpOperationParameter, { type: "query" }>,
): Iterable<string> {
  const nameCase = parseCase(parameter.param.name);

  // UrlSearchParams annoyingly returns null for missing parameters instead of undefined.
  yield `const ${nameCase.camelCase} = ${names.queryParams}.get(${JSON.stringify(parameter.name)}) ?? undefined;`;

  if (!parameter.param.optional) {
    yield `if (!${nameCase.camelCase}) {`;
    yield `  ${names.ctx}.errorHandlers.onInvalidRequest(${names.ctx}, ${JSON.stringify(operation.path)}, "missing required query parameter '${parameter.name}');`;
    yield "}";
    yield "";
  }
}
