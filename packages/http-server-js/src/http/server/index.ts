// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import {
  ModelProperty,
  NoTarget,
  Type,
  compilerAssert,
  isArrayModelType,
  isRecordModelType,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {
  HttpOperation,
  HttpOperationFileBody,
  HttpOperationParameter,
  HttpOperationResponseContent,
  getHeaderFieldName,
  getHttpOperation,
} from "@typespec/http";
import { createOrGetModuleForNamespace } from "../../common/namespace.js";
import { emitTypeReference, isValueLiteralType } from "../../common/reference.js";
import {
  SerializableType,
  isSerializationRequired,
  requireSerialization,
} from "../../common/serialization/index.js";
import { Module, completePendingDeclarations, createModule } from "../../ctx.js";
import { ReCase, isUnspeakable, parseCase } from "../../util/case.js";
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
import { module as httpHelpers } from "../../../generated-defs/helpers/http.js";
import { getJsScalar } from "../../common/scalar.js";
import {
  requiresJsonSerialization,
  transposeExpressionFromJson,
  transposeExpressionToJson,
} from "../../common/serialization/json.js";
import { getFullyQualifiedTypeName } from "../../util/name.js";
import { canonicalizeHttpOperation } from "../operation.js";

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

  const isHttpResponder = ctx.gensym("isHttpResponder");
  const httpResponderSym = ctx.gensym("httpResponderSymbol");

  serverRawModule.imports.push({
    binder: [`isHttpResponder as ${isHttpResponder}`, `HTTP_RESPONDER as ${httpResponderSym}`],
    from: httpHelpers,
  });

  for (const operation of ctx.httpService.operations) {
    serverRawModule.declarations.push([
      ...emitRawServerOperation(ctx, operation, serverRawModule, {
        isHttpResponder,
        httpResponderSym,
      }),
    ]);
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
  responderNames: Pick<Names, "isHttpResponder" | "httpResponderSym">,
): Iterable<string> {
  let op = operation.operation;
  const operationNameCase = parseCase(op.name);

  const container = op.interface ?? op.namespace!;
  const containerNameCase = parseCase(container.name);

  op = canonicalizeHttpOperation(ctx, op);
  [operation] = getHttpOperation(ctx.program, op);

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
    ...responderNames,
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

  const parsedParams = new Map<ModelProperty, HttpOperationParameter>();

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
        parsedParams.set(resolvedParameter, parameter);
        break;
      case "path":
        // Already handled above.
        parsedParams.set(resolvedParameter, parameter);
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
      body.property?.type ?? operation.operation,
      module,
      {
        altName: defaultBodyTypeName,
        requireDeclaration: requiresJsonSerialization(ctx, module, body.type),
      },
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

        if (requiresJsonSerialization(ctx, module, body.type)) {
          if (body.type.kind === "Model" && isArrayModelType(body.type)) {
            yield `        const __arrayBody = JSON.parse(body);`;
            yield `        if (!Array.isArray(__arrayBody)) {`;
            yield `          ${names.ctx}.errorHandlers.onInvalidRequest(`;
            yield `            ${names.ctx},`;
            yield `            ${JSON.stringify(operation.path)},`;
            yield `            "expected JSON array in request body",`;
            yield `          );`;
            yield `          return reject();`;
            yield `        }`;
            value = transposeExpressionFromJson(ctx, body.type, `__arrayBody`, module);
          } else if (body.type.kind === "Model" && isRecordModelType(body.type)) {
            yield `        const __recordBody = JSON.parse(body);`;
            yield `        if (typeof __recordBody !== "object" || __recordBody === null) {`;
            yield `          ${names.ctx}.errorHandlers.onInvalidRequest(`;
            yield `            ${names.ctx},`;
            yield `            ${JSON.stringify(operation.path)},`;
            yield `            "expected JSON object in request body",`;
            yield `          );`;
            yield `          return reject();`;
            yield `        }`;
            value = transposeExpressionFromJson(ctx, body.type, `__recordBody`, module);
          } else if (body.type.kind === "Scalar") {
            value = transposeExpressionFromJson(ctx, body.type, `JSON.parse(body)`, module);
          } else {
            value = `${bodyTypeName}.fromJsonObject(globalThis.JSON.parse(body))`;
          }
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
      case "multipart/form-data": {
        if (body.bodyKind === "multipart") {
          yield* indent(
            emitMultipart(ctx, module, operation, body, names.ctx, bodyName, bodyTypeName),
          );
        } else {
          yield* indent(emitMultipartLegacy(names.ctx, bodyName, bodyTypeName));
        }
        break;
      }
      case "text/plain": {
        const string = ctx.program.checker.getStdType("string");
        const assignable = $(ctx.program).type.isAssignableTo(
          body.type,
          string,
          body.property ?? body.type,
        );
        if (!assignable) {
          const name =
            ("namespace" in body.type &&
              body.type.namespace &&
              getFullyQualifiedTypeName(body.type)) ||
            ("name" in body.type && typeof body.type.name === "string" && body.type.name) ||
            "<unknown>";
          reportDiagnostic(ctx.program, {
            code: "unrecognized-media-type",
            target: body.property ?? body.type,
            format: {
              mediaType: contentType,
              type: name,
            },
          });
        }

        yield `  const ${bodyName} = await new Promise(function parse${bodyNameCase.pascalCase}(resolve, reject) {`;
        yield `    const chunks: Array<Buffer> = [];`;
        yield `    ${names.ctx}.request.on("data", function appendChunk(chunk) { chunks.push(chunk); });`;
        yield `    ${names.ctx}.request.on("end", function finalize() {`;
        yield `      try {`;
        yield `        const body = Buffer.concat(chunks).toString();`;
        yield `        resolve(body);`;
        yield `      } catch (e) {`;
        yield `        ${names.ctx}.errorHandlers.onInvalidRequest(`;
        yield `          ${names.ctx},`;
        yield `          ${JSON.stringify(operation.path)},`;
        yield `          "invalid text in request body",`;
        yield `        );`;
        yield `        reject(e);`;
        yield `      }`;
        yield `    });`;
        yield `    ${names.ctx}.request.on("error", reject);`;
        yield `  }) as string;`;
        yield "";
        break;
      }
      case "application/octet-stream":
      default:
        {
          if (!ctx.program.checker.isStdType(body.type, "bytes")) {
            const name =
              ("namespace" in body.type &&
                body.type.namespace &&
                getFullyQualifiedTypeName(body.type)) ||
              ("name" in body.type && typeof body.type.name === "string" && body.type.name) ||
              "<unknown>";

            reportDiagnostic(ctx.program, {
              code: "unrecognized-media-type",
              target: body.property ?? body.type,
              format: {
                mediaType: contentType,
                type: name,
              },
            });
          }
          yield `  const ${bodyName} = await new Promise(function parse${bodyNameCase.pascalCase}(resolve, reject) {`;
          yield `    const chunks: Array<Buffer> = [];`;
          yield `    ${names.ctx}.request.on("data", function appendChunk(chunk) { chunks.push(chunk); });`;
          yield `    ${names.ctx}.request.on("end", function finalize() {`;
          yield `      try {`;
          yield `        const body = Buffer.concat(chunks);`;
          yield `        resolve(body);`;
          yield `      } catch (e) {`;
          yield `        reject(e);`;
          yield `      }`;
          yield `    });`;
          yield `    ${names.ctx}.request.on("error", reject);`;
          yield `  }) as Buffer;`;
          yield "";
          break;
        }
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
    const paramNameSafe = keywordSafe(paramNameCase.camelCase);
    const isBodyField = bodyFields.has(param.name) && bodyFields.get(param.name) === param.type;
    const isBodyExact = operation.parameters.body?.property === param;
    const isPathParameter = operation.parameters.parameters.some(
      (p) => p.type === "path" && p.param === param,
    );

    if (isPathParameter) {
      paramBaseExpression = `${paramNameSafe}`;
    } else if (isBodyField) {
      paramBaseExpression = `${bodyName}.${paramNameCase.camelCase}`;
    } else if (isBodyExact) {
      paramBaseExpression = bodyName!;
    } else {
      const resolvedParameter = param.type.kind === "ModelProperty" ? param.type : param;

      const httpOperationParam = parsedParams.get(resolvedParameter);

      if (resolvedParameter.type.kind === "Scalar" && httpOperationParam) {
        const jsScalar = getJsScalar(ctx, module, resolvedParameter.type, resolvedParameter);

        const encoder = jsScalar.http[httpOperationParam.type];

        const decoded = encoder.decode(paramNameSafe);

        paramBaseExpression = param.optional
          ? `${paramNameSafe} === undefined ? undefined : (${decoded})`
          : decoded;
      } else {
        paramBaseExpression = paramNameSafe;
      }
    }

    if (param.optional) {
      hasOptions = true;
      optionalParams.set(paramNameCase.camelCase, paramBaseExpression);
    } else {
      requiredParams.push(paramBaseExpression);
    }
  }

  const paramLines = requiredParams.map((p) => `${keywordSafe(p)},`);

  if (hasOptions) {
    paramLines.push(
      `{ ${[...optionalParams.entries()].map(([name, expr]) => (name === expr ? name : `${name}: ${expr}`)).join(", ")} }`,
    );
  }

  const returnType = emitTypeReference(ctx, op.returnType, NoTarget, module, {
    altName: operationNameCase.pascalCase + "Result",
  });

  yield `  let ${names.result}: ${returnType};`;
  yield "";
  yield `  try {`;
  yield `    ${names.result} = await ${names.operations}.${operationNameCase.camelCase}(${names.ctx}, `;
  yield* indent(indent(indent(paramLines)));
  yield `    );`;
  yield "  } catch(e) {";
  yield `    if (${names.isHttpResponder}(e)) {`;
  yield `      return e[${names.httpResponderSym}](${names.ctx});`;
  yield `    } else throw e;`;
  yield `  }`;
  yield "";

  yield* indent(
    emitResultProcessing(
      ctx,
      createNamer(operationNameCase),
      names,
      operation,
      op.returnType,
      module,
    ),
  );

  yield "}";

  yield "";
}

interface Names {
  ctx: string;
  result: string;
  operations: string;
  queryParams: string;
  isHttpResponder: string;
  httpResponderSym: string;
}

interface Namer {
  opName: ReCase;

  names: Record<string, number>;

  getAltName(name: string): string;
}

function createNamer(opName: ReCase): Namer {
  const names: Record<string, number> = {};

  return {
    opName,
    names,
    getAltName(name: string): string {
      names[name] ??= 1;
      const idx = names[name]++;

      return this.opName.pascalCase + (idx === 1 ? name : `${name}_${idx}`);
    },
  };
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
  namer: Namer,
  names: Names,
  operation: HttpOperation,
  t: Type,
  module: Module,
): Iterable<string> {
  if (t.kind !== "Union") {
    // Single target type
    yield* emitResultProcessingForType(
      ctx,
      namer,
      names,
      t,
      getResponseContentForType(operation, t),
      module,
    );
  } else {
    const codeTree = differentiateUnion(ctx, module, t);

    yield* writeCodeTree(ctx, codeTree, {
      subject: names.result,
      referenceModelProperty(p) {
        return names.result + "." + parseCase(p.name).camelCase;
      },
      // We mapped the output directly in the code tree input, so we can just return it.
      renderResult: (t) =>
        emitResultProcessingForType(
          ctx,
          namer,
          names,
          t,
          getResponseContentForType(operation, t),
          module,
        ),
    });
  }
}

function getResponseContentForType(
  operation: HttpOperation,
  target: Type,
): HttpOperationResponseContent | undefined {
  for (const response of operation.responses) {
    if (response.type === target) {
      return response.responses.find((candidate) => candidate.body) ?? response.responses[0];
    }
  }

  return undefined;
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
  namer: Namer,
  names: Names,
  target: Type,
  responseContent: HttpOperationResponseContent | undefined,
  module: Module,
): Iterable<string> {
  if (target.kind === "Intrinsic") {
    switch (target.name) {
      case "void":
        yield `${names.ctx}.response.statusCode = 204;`;
        yield `${names.ctx}.response.end();`;
        return;
      case "null":
        yield `${names.ctx}.response.statusCode = 200;`;
        yield `${names.ctx}.response.setHeader("content-type", "application/json");`;
        yield `${names.ctx}.response.end("null");`;
        return;
      case "unknown":
        yield `${names.ctx}.response.statusCode = 200;`;
        yield `${names.ctx}.response.setHeader("content-type", "application/json");`;
        yield `${names.ctx}.response.end(globalThis.JSON.stringify(${names.result}));`;
        return;
      case "never":
        yield `return ${names.ctx}.errorHandlers.onInternalError(${names.ctx}, "Internal server error.");`;
        return;
      default:
        throw new UnimplementedError(`result processing for intrinsic type '${target.name}'`);
    }
  }

  if (target.kind === "Scalar" || isValueLiteralType(target)) {
    if (
      responseContent &&
      (yield* emitRawResponseBody(ctx, names, responseContent, names.result))
    ) {
      return;
    }

    const serializationRequired =
      target.kind === "Scalar" && isSerializationRequired(ctx, module, target, "application/json");

    if (target.kind === "Scalar") {
      requireSerialization(ctx, target, "application/json");
    }

    yield `${names.ctx}.response.setHeader("content-type", "application/json");`;

    if (serializationRequired) {
      yield `${names.ctx}.response.end(globalThis.JSON.stringify(${transposeExpressionToJson(ctx, target, names.result, module)}));`;
    } else {
      yield `${names.ctx}.response.end(globalThis.JSON.stringify(${names.result}));`;
    }

    return;
  }

  if (target.kind !== "Model") {
    throw new UnimplementedError(`result processing for type kind '${target.kind}'`);
  }

  const body = responseContent?.body;
  const responseProperties = responseContent?.properties ?? [];
  const bodyMetadataProperty = responseProperties.find(
    (property) =>
      property.kind === "body" || property.kind === "bodyRoot" || property.kind === "multipartBody",
  );
  const hasResolvedContentTypeHeader = responseProperties.some(
    (property) =>
      property.kind === "contentType" ||
      (property.kind === "header" && property.options.name.toLowerCase() === "content-type"),
  );

  for (const property of responseProperties) {
    switch (property.kind) {
      case "header": {
        const headerValue = isValueLiteralType(property.property.type)
          ? getValueLiteralExpression(property.property.type)
          : getPropertyPathExpression(names.result, property.path);
        yield `${names.ctx}.response.setHeader(${JSON.stringify(property.options.name.toLowerCase())}, ${headerValue});`;
        if (!body) {
          yield* emitDeleteForPath(names.result, property.path);
        }
        break;
      }
      case "contentType": {
        const contentTypeValue = isValueLiteralType(property.property.type)
          ? getValueLiteralExpression(property.property.type)
          : getPropertyPathExpression(names.result, property.path);
        yield `${names.ctx}.response.setHeader("content-type", ${contentTypeValue});`;
        if (!body) {
          yield* emitDeleteForPath(names.result, property.path);
        }
        break;
      }
      case "statusCode": {
        if (isUnspeakable(property.property.name)) {
          if (!isValueLiteralType(property.property.type)) {
            reportDiagnostic(ctx.program, {
              code: "unspeakable-status-code",
              target: property.property,
              format: {
                name: property.property.name,
              },
            });
            continue;
          }

          compilerAssert(property.property.type.kind === "Number", "Status code must be a number.");
          yield `${names.ctx}.response.statusCode = ${property.property.type.valueAsString};`;
        } else {
          const statusCodeValue = isValueLiteralType(property.property.type)
            ? getValueLiteralExpression(property.property.type)
            : getPropertyPathExpression(names.result, property.path);
          yield `${names.ctx}.response.statusCode = ${statusCodeValue};`;
          if (!body) {
            yield* emitDeleteForPath(names.result, property.path);
          }
        }
        break;
      }
    }
  }

  const allMetadataIsRemoved =
    !body &&
    responseProperties.every(
      (property) =>
        property.kind === "header" ||
        property.kind === "contentType" ||
        property.kind === "statusCode",
    );

  if (body) {
    const bodyExpression = bodyMetadataProperty
      ? getPropertyPathExpression(names.result, bodyMetadataProperty.path)
      : names.result;

    if (
      responseContent &&
      (yield* emitRawResponseBody(ctx, names, responseContent, bodyExpression))
    ) {
      return;
    }

    const serializationRequired = isSerializationRequired(
      ctx,
      module,
      body.type,
      "application/json",
    );
    requireSerialization(ctx, body.type, "application/json");

    if (!hasResolvedContentTypeHeader) {
      yield `${names.ctx}.response.setHeader("content-type", "application/json");`;
    }

    if (serializationRequired) {
      yield `${names.ctx}.response.end(globalThis.JSON.stringify(${transposeExpressionToJson(ctx, body.type, bodyExpression, module)}));`;
    } else {
      yield `${names.ctx}.response.end(globalThis.JSON.stringify(${bodyExpression}));`;
    }
  } else if (isArrayModelType(target)) {
    const itemType = target.indexer.value;

    const serializationRequired = isSerializationRequired(
      ctx,
      module,
      itemType,
      "application/json",
    );
    requireSerialization(ctx, itemType, "application/json");

    yield `${names.ctx}.response.setHeader("content-type", "application/json");`;

    if (serializationRequired) {
      yield `${names.ctx}.response.end(globalThis.JSON.stringify(${transposeExpressionToJson(ctx, target, names.result, module)}));`;
    } else {
      yield `${names.ctx}.response.end(globalThis.JSON.stringify(${names.result}));`;
    }
  } else if (isRecordModelType(target)) {
    const itemType = target.indexer.value;

    const serializationRequired = isSerializationRequired(
      ctx,
      module,
      itemType,
      "application/json",
    );
    requireSerialization(ctx, itemType, "application/json");

    yield `${names.ctx}.response.setHeader("content-type", "application/json");`;

    if (serializationRequired) {
      yield `${names.ctx}.response.end(globalThis.JSON.stringify(${transposeExpressionToJson(ctx, target, names.result, module)}));`;
    } else {
      yield `${names.ctx}.response.end(globalThis.JSON.stringify(${names.result}));`;
    }
  } else {
    if (
      responseContent &&
      (yield* emitRawResponseBody(ctx, names, responseContent, names.result))
    ) {
      return;
    }

    if (allMetadataIsRemoved) {
      yield `${names.ctx}.response.end();`;
    } else {
      const serializationRequired = isSerializationRequired(
        ctx,
        module,
        target,
        "application/json",
      );
      requireSerialization(ctx, target, "application/json");

      yield `${names.ctx}.response.setHeader("content-type", "application/json");`;

      if (serializationRequired) {
        const typeReference = emitTypeReference(ctx, target, target, module, {
          altName: namer.getAltName("Result"),
          requireDeclaration: true,
        });
        yield `${names.ctx}.response.end(globalThis.JSON.stringify(${typeReference}.toJsonObject(${names.result} as ${typeReference})));`;
      } else {
        yield `${names.ctx}.response.end(globalThis.JSON.stringify(${names.result}));`;
      }
    }
  }
}

function* emitRawResponseBody(
  ctx: HttpContext,
  names: Names,
  responseContent: HttpOperationResponseContent,
  bodyExpression: string,
): Generator<string, boolean, void> {
  const body = responseContent.body;

  if (!body) {
    return false;
  }

  function emitsResolvedContentType(
    property: ModelProperty | undefined,
  ): property is ModelProperty {
    return (
      !!property &&
      responseContent.properties.some(
        (candidate) =>
          candidate.property === property &&
          (candidate.kind === "contentType" ||
            (candidate.kind === "header" &&
              candidate.options.name.toLowerCase() === "content-type")),
      )
    );
  }

  function emitsResolvedHeader(property: ModelProperty | undefined): property is ModelProperty {
    return (
      !!property &&
      responseContent.properties.some(
        (candidate) => candidate.property === property && candidate.kind === "header",
      )
    );
  }

  if (body.bodyKind === "file") {
    const fileBody = body as HttpOperationFileBody;
    const contentTypeProperty = fileBody.contentTypeProperty as ModelProperty;
    const filenameProperty = fileBody.filename as ModelProperty;

    if (!emitsResolvedContentType(contentTypeProperty)) {
      const fallbackContentType = JSON.stringify(
        fileBody.contentTypes[0] ?? "application/octet-stream",
      );
      yield `${names.ctx}.response.setHeader("content-type", ${bodyExpression}.contentType ?? ${fallbackContentType});`;
    }

    if (emitsResolvedHeader(filenameProperty)) {
      const headerName = getHeaderFieldName(ctx.program, filenameProperty).toLowerCase();
      yield `${names.ctx}.response.setHeader(${JSON.stringify(headerName)}, ${bodyExpression}.filename);`;
    } else {
      yield `if (${bodyExpression}.filename !== undefined) {`;
      yield `  ${names.ctx}.response.setHeader("content-disposition", \`attachment; filename="\${${bodyExpression}.filename}"\`);`;
      yield `}`;
    }

    yield `${names.ctx}.response.end(${bodyExpression}.contents);`;
    return true;
  }

  if (
    body.bodyKind === "single" &&
    ctx.program.checker.isStdType(body.type, "bytes") &&
    !body.contentTypes.some(isJsonContentType)
  ) {
    if (!emitsResolvedContentType(body.contentTypeProperty)) {
      const contentType = body.contentTypes[0] ?? "application/octet-stream";
      yield `${names.ctx}.response.setHeader("content-type", ${JSON.stringify(contentType)});`;
    }

    yield `${names.ctx}.response.end(${bodyExpression});`;
    return true;
  }

  return false;
}

function isJsonContentType(contentType: string): boolean {
  return (
    contentType === "application/json" ||
    contentType === "text/json" ||
    contentType.endsWith("+json")
  );
}

function getValueLiteralExpression(type: Type): string {
  compilerAssert(isValueLiteralType(type), "Expected a value literal type.");

  switch (type.kind) {
    case "String":
    case "Boolean":
      return JSON.stringify(type.value);
    case "Number":
      return type.valueAsString;
    default:
      compilerAssert(false, `Unsupported value literal type '${type.kind}'.`);
  }
}

function getPropertyPathExpression(root: string, path: readonly (string | number)[]): string {
  let expression = root;

  for (const segment of path) {
    expression =
      typeof segment === "number"
        ? `${expression}[${segment}]`
        : `${expression}.${parseCase(segment).camelCase}`;
  }

  return expression;
}

function* emitDeleteForPath(
  root: string,
  path: readonly (string | number)[],
): Generator<string, void, void> {
  if (path.length === 0) {
    return;
  }

  const parentExpression =
    path.length === 1 ? root : getPropertyPathExpression(root, path.slice(0, path.length - 1));
  const leaf = path[path.length - 1]!;

  if (typeof leaf === "number") {
    yield `delete (${parentExpression} as any)[${leaf}];`;
  } else {
    yield `delete (${parentExpression} as any).${parseCase(leaf).camelCase};`;
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
  const name = keywordSafe(nameCase.camelCase);
  const headerName = parameter.name.toLowerCase();

  // See https://nodejs.org/api/http.html#messageheaders
  // Apparently, only set-cookie can be an array.
  const canBeArrayType = parameter.name === "set-cookie";

  const assertion = canBeArrayType ? "" : " as string | undefined";

  yield `const ${name} = ${names.ctx}.request.headers[${JSON.stringify(headerName)}]${assertion};`;

  if (!parameter.param.optional) {
    yield `if (${name} === undefined) {`;
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

  const name = keywordSafe(nameCase.camelCase);

  // UrlSearchParams annoyingly returns null for missing parameters instead of undefined.
  yield `const ${name} = ${names.queryParams}.get(${JSON.stringify(parameter.name)}) ?? undefined;`;

  if (!parameter.param.optional) {
    yield `if (!${name}) {`;
    yield `  return ${names.ctx}.errorHandlers.onInvalidRequest(${names.ctx}, ${JSON.stringify(operation.path)}, "missing required query parameter '${parameter.name}'");`;
    yield "}";
    yield "";
  }
}
