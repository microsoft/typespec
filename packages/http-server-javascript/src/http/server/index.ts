import { ModelProperty, Type, getMaxValue, getMinValue } from "@typespec/compiler";
import {
  HttpOperation,
  HttpOperationParameter,
  getHeaderFieldName,
  isBody,
  isHeader,
  isStatusCode,
} from "@typespec/http";
import {
  SplitReturnType,
  UnionSplitReturnType,
  isInfallible,
  splitReturnType,
} from "../../common/interface.js";
import { createOrGetModuleForNamespace } from "../../common/namespace.js";
import { emitTypeReference, isValueLiteralType } from "../../common/reference.js";
import { parseTemplateForScalar } from "../../common/scalar.js";
import { Module, completePendingDeclarations, createModule } from "../../ctx.js";
import { bifilter } from "../../util/bifilter.js";
import { parseCase } from "../../util/case.js";
import { UnimplementedError } from "../../util/error.js";
import { getAllProperties } from "../../util/extends.js";
import { indent } from "../../util/indent.js";
import { keywordSafe } from "../../util/keywords.js";
import { HttpContext } from "../feature.js";

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

  const [successType, errorType] = splitReturnType(
    ctx,
    op.returnType,
    module,
    operationNameCase.pascalCase
  );

  completePendingDeclarations(ctx);

  const pathParameters = operation.parameters.parameters.filter(function isPathParameter(param) {
    return param.type === "path";
  }) as Extract<HttpOperationParameter, { type: "path" }>[];

  const functionName = keywordSafe(containerNameCase.snakeCase + "_" + operationNameCase.snakeCase);

  yield `export async function ${functionName}(`;
  // prettier-ignore
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

    const bodyNameCase = parseCase(body.parameter?.name ?? defaultBodyTypeName);

    const bodyTypeName = emitTypeReference(
      ctx,
      body.type,
      body.parameter?.type ?? operation.operation.node,
      module,
      defaultBodyTypeName
    );

    bodyName = bodyNameCase.camelCase;

    yield `  if (!request.headers["content-type"]?.startsWith(${JSON.stringify(contentType)})) {`;
    yield `    throw new Error(\`Invalid Request: expected content-type '${contentType}' but got '\${request.headers["content-type"]?.split(";", 2)[0]}'.\`)`;
    yield "  }";
    yield "";

    // TODO/witemple if the request errors, we need to reject these promises and handle the error with onInvalidRequest
    switch (contentType) {
      case "application/merge-patch+json":
      case "application/json": {
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
        // TODO/witemple: this synchronously buffers the entire request body into memory -- not desirable, but will do for now.
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
        // TODO/witemple is this the right default content type for multipart?
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

  const fallible = !isInfallible(errorType);

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
      `{ ${[...optionalParams.entries()].map(([name, expr]) => `${name}: ${expr},`)} }`
    );
  }

  const successProcessingBody = [
    `  const result = await operations.${operationNameCase.camelCase}(`,
    ...indent(indent(paramLines)),
    `  );`,
    "",
  ];

  successProcessingBody.push(...indent(emitResultProcessing(ctx, successType)));

  // TODO/witemple: the whole way error processing works is broken, need to come up with
  // a better way to have business logic return errors.
  if (fallible) {
    // yield `  try {`;
    yield* indent(successProcessingBody);
    // yield `  } catch (_e) {`;
    // yield `    const error = _e as ${errorType.typeReference};`;

    // // TODO/witemple: not handling error cases correctly, but all cases are detected as success responses for some other reason,
    // // so this is actually dead code.
    // yield `    throw _e;`;

    // yield `  }`;
  } else {
    yield* successProcessingBody;
  }

  yield "}";

  yield "";
}

/**
 * Emit the result-processing code for an operation.
 *
 * This code handles writing the result of calling the business logic layer to the HTTP response object.
 *
 * @param ctx - The HTTP emitter context.
 * @param split - The SplitReturnType instance representing the return type of the operation.
 */
function* emitResultProcessing(ctx: HttpContext, split: SplitReturnType): Iterable<string> {
  if (split.kind === "ordinary") {
    // Single target type
    if (typeof split.target === "undefined" || Array.isArray(split.target)) {
      throw new Error("Unimplemented: splitReturnType target array or undefined");
    }
    yield* emitResultProcessingForType(ctx, split.target);
  } else {
    // Union target, we need to make a decision tree to determine which type was actually returned and process it.
    const decisionTree = createResultProcessingDecisionTree(ctx, split);

    yield* emitDecisionTreeResultProcessing(ctx, decisionTree);
  }
}

/**
 * Emit the result-processing code for a single response type.
 *
 * @param ctx - The HTTP emitter context.
 * @param target - The target type to emit processing code for.
 */
function* emitResultProcessingForType(ctx: HttpContext, target: Type): Iterable<string> {
  if (target.kind !== "Model") {
    throw new Error(`Unimplemented: result processing for type kind '${target.kind}'`);
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
    yield `response.end(JSON.stringify(result.${bodyCase.camelCase}));`;
  } else {
    if (allMetadataIsRemoved) {
      yield `response.end();`;
    } else {
      yield `response.end(JSON.stringify(result));`;
    }
  }
}

/**
 * Represents a decision tree for processing the result of an operation.
 */
type OutputDecisionTree =
  | OutputDecisionTreeResult
  | OutputDecisionTreeSwitch
  | OutputDecisionTreeIfChain;

/**
 * Represents a position in the decision tree where a type is known.
 */
interface OutputDecisionTreeResult {
  kind: "result";
  type: Type;
}

type JsValue = string | number;

/**
 * Represents a position in the decision tree where a switch statement may be used to reach a new node.
 */
interface OutputDecisionTreeSwitch {
  kind: "switch";
  path: [string, ...string[]];
  values: Map<JsValue, OutputDecisionTree>;
}

/**
 * Represents a position in the decision tree where an if-else chain may be used to reach a new node.
 */
interface OutputDecisionTreeIfChain {
  kind: "if-chain";
  path: [string, ...string[]];
  conditions: Map<OdtCondition, OutputDecisionTree>;
}

/**
 * A condition that may be used in an if-else chain.
 */
type OdtCondition = OdtExactCondition | OdtRangeCondition;

/**
 * A condition that matches an exact value.
 */
interface OdtExactCondition {
  kind: "exact";
  value: JsValue;
}

/**
 * A condition that matches a numerical range.
 */
interface OdtRangeCondition {
  kind: "range";
  bounds: [number, number];
}

/**
 * Creates a decision tree rooted at the given split return type. The decision tree will determine which particular type
 * a value has at runtime and run the appropriate processing code for it.
 *
 * @param ctx - The HTTP emitter context.
 * @param split - The split return type to create a decision tree for.
 * @returns a decision tree that determines the type of a value and dispatches it to the correct processing code.
 */
function createResultProcessingDecisionTree(
  ctx: HttpContext,
  split: UnionSplitReturnType
): OutputDecisionTree {
  // We can only switch if all the types have a statusCode property that is a single number.
  const canSwitch = split.variants.every(
    (v) =>
      v.type.kind === "Model" &&
      v.type.properties.has("statusCode") &&
      v.type.properties.get("statusCode")!.type.kind === "Number"
  );

  if (canSwitch) {
    // TODO/witemple: just assuming statusCode exists on all these types and that they're all models
    const output: OutputDecisionTreeSwitch = {
      kind: "switch",
      path: ["statusCode"],
      values: new Map(),
    };

    for (const variant of split.variants) {
      if (variant.type.kind !== "Model") {
        throw new Error(`Output decision tree: variant is not a model, got ${variant.type.kind}`);
      }

      const statusCode = variant.type.properties.get("statusCode");

      if (!statusCode || statusCode.type.kind !== "Number") {
        throw new Error(
          `Output decision tree: status code property cannot be converted to a number, got kind '${statusCode?.type.kind}'.`
        );
      }

      output.values.set(statusCode.type.value, {
        kind: "result",
        type: variant.type,
      });
    }

    return output;
  } else {
    // Use an if chain
    const output: OutputDecisionTreeIfChain = {
      kind: "if-chain",
      path: ["statusCode"],
      conditions: new Map(),
    };

    for (const variant of split.variants) {
      if (variant.type.kind !== "Model") {
        throw new Error(`Output decision tree: variant is not a model, got ${variant.type.kind}`);
      }

      const statusCode = variant.type.properties.get("statusCode");

      if (!statusCode) {
        throw new Error(
          `Output decision tree: output model ${variant.type.name ?? "<anonymous>"} does not have a status code.`
        );
      }

      if (statusCode.type.kind === "Number") {
        output.conditions.set(
          { kind: "exact", value: statusCode.type.value },
          { kind: "result", type: variant.type }
        );
      } else if (statusCode.type.kind === "Scalar") {
        // TODO/witemple: just _assuming_ this is an int type. The HTTP layer should check this, but I'm not actually validating
        // that the `statusCode` property is the HTTP status code.
        const minValue = getMinValue(ctx.program, statusCode);
        const maxValue = getMaxValue(ctx.program, statusCode);

        if (minValue === undefined || maxValue === undefined) {
          throw new Error(
            `Output decision tree: status code property is not a number or scalar with bounds, got ${statusCode.type.name}`
          );
        }

        output.conditions.set(
          { kind: "range", bounds: [minValue, maxValue] },
          { kind: "result", type: variant.type }
        );
      }
    }

    return output;
  }
}

/**
 * Convert the OutputDecisionTree DSL structure into TypeScript code.
 * @param ctx - The HTTP emitter context.
 * @param tree - The decision tree to generate code for.
 */
function* emitDecisionTreeResultProcessing(
  ctx: HttpContext,
  tree: OutputDecisionTree
): Iterable<string> {
  switch (tree.kind) {
    case "result":
      yield* emitResultProcessingForType(ctx, tree.type);
      break;
    case "switch":
      yield `switch (result.${tree.path.join(".")}) {`;
      for (const [value, subtree] of tree.values) {
        yield `  case ${JSON.stringify(value)}:`;
        yield* indent(emitDecisionTreeResultProcessing(ctx, subtree));
        yield `    break;`;
      }
      yield "}";
      break;
    case "if-chain":
      let first = true;
      for (const [condition, subtree] of tree.conditions) {
        let conditionExpr: string;
        if (condition.kind === "exact") {
          const valueExpr =
            typeof condition.value === "string" ? JSON.stringify(condition.value) : condition.value;
          conditionExpr = `result.${tree.path.join(".")} === ${valueExpr}`;
        } else {
          const [start, end] = condition.bounds;
          conditionExpr = `result.${tree.path.join(".")} >= ${start} && result.${tree.path.join(".")} <= ${end}`;
        }

        if (first) {
          first = false;
          yield `if (${conditionExpr}) {`;
        } else {
          yield `} else if (${conditionExpr}) {`;
        }
        yield* indent(emitDecisionTreeResultProcessing(ctx, subtree));
      }
      yield "}";
      break;
    default:
      throw new Error(
        `Unimplemented: decision tree kind '${(tree satisfies never as any).kind}' for result processing`
      );
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

  yield `const ${nameCase.camelCase} = request.headers[${JSON.stringify(parameter.name)}];`;

  if (!parameter.param.optional) {
    yield `if (${nameCase.camelCase} === undefined) {`;
    // TODO/witemple: call invalid request handler somehow instead of throwing
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

  // TODO/witemple: handle complex query parameters with encodings such as CSV, multiple occurrence, etc.

  yield `const ${nameCase.camelCase} = __query_params.get(${JSON.stringify(parameter.name)});`;

  if (!parameter.param.optional) {
    yield `if (${nameCase.camelCase} === null) {`;
    // prettier-ignore
    yield `  throw new Error("Invalid request: missing required query parameter '${parameter.name}'.");`;
    yield "}";
    yield "";
  }
}
