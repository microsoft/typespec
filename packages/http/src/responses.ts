import {
  compilerAssert,
  createDiagnosticCollector,
  Diagnostic,
  DiagnosticCollector,
  DocContent,
  getDoc,
  getErrorsDoc,
  getReturnsDoc,
  isErrorModel,
  isNullType,
  isVoidType,
  Model,
  ModelProperty,
  Operation,
  Program,
  Type,
} from "@typespec/compiler";
import {
  ArrayExpressionNode,
  IntersectionExpressionNode,
  Node,
  SyntaxKind,
  TypeReferenceNode,
  UnionExpressionNode,
  UnionStatementNode,
} from "@typespec/compiler/ast";
import { $ } from "@typespec/compiler/typekit";
import { getStatusCodeDescription, getStatusCodesWithDiagnostics } from "./decorators.js";
import { HttpProperty } from "./http-property.js";
import { HttpStateKeys, reportDiagnostic } from "./lib.js";
import { Visibility } from "./metadata.js";
import { HttpPayloadDisposition, resolveHttpPayload } from "./payload.js";
import { HttpOperationResponse, HttpStatusCodes, HttpStatusCodesEntry } from "./types.js";

/**
 * Get the responses for a given operation.
 */
export function getResponsesForOperation(
  program: Program,
  operation: Operation,
): [HttpOperationResponse[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const responseType = operation.returnType;
  const responses = new ResponseIndex();
  const tk = $(program);
  const inlineDocNodeTreeMap = generateInlineDocNodeTreeMap(program, operation);

  if (tk.union.is(responseType) && !tk.union.getDiscriminatedUnion(responseType)) {
    // Check if the union itself has a @doc to use as the response description
    const unionDescription = getDoc(program, responseType);
    for (const option of responseType.variants.values()) {
      if (isNullType(option.type)) {
        // TODO how should we treat this? https://github.com/microsoft/typespec/issues/356
        continue;
      }
      processResponseType(
        program,
        diagnostics,
        operation,
        responses,
        option.type,
        inlineDocNodeTreeMap,
        unionDescription,
      );
    }
  } else {
    processResponseType(
      program,
      diagnostics,
      operation,
      responses,
      responseType,
      inlineDocNodeTreeMap,
      undefined,
    );
  }

  return diagnostics.wrap(responses.values());
}

/**
 * Class keeping an index of all the response by status code
 */
class ResponseIndex {
  readonly #index = new Map<string, HttpOperationResponse>();

  public get(statusCode: HttpStatusCodesEntry): HttpOperationResponse | undefined {
    return this.#index.get(this.#indexKey(statusCode));
  }

  public set(statusCode: HttpStatusCodesEntry, response: HttpOperationResponse): void {
    this.#index.set(this.#indexKey(statusCode), response);
  }

  public values(): HttpOperationResponse[] {
    return [...this.#index.values()];
  }

  #indexKey(statusCode: HttpStatusCodesEntry) {
    if (typeof statusCode === "number" || statusCode === "*") {
      return String(statusCode);
    } else {
      return `${statusCode.start}-${statusCode.end}`;
    }
  }
}

function processResponseType(
  program: Program,
  diagnostics: DiagnosticCollector,
  operation: Operation,
  responses: ResponseIndex,
  responseType: Type,
  inlineDocNodeTreeMap: InlineDocNodeTreeMap,
  parentDescription?: string,
) {
  const tk = $(program);

  // If the response type is itself a union (and not discriminated), expand it recursively.
  // This handles cases where a named union is used as a return type (e.g., `op read(): MyUnion`)
  // or when unions are nested (e.g., a union variant is itself a union).
  // Each variant will be processed separately to extract its status codes and responses.
  if (tk.union.is(responseType) && !tk.union.getDiscriminatedUnion(responseType)) {
    // Check if this nested union has its own @doc, otherwise inherit parent's description
    const unionDescription = getDoc(program, responseType) ?? parentDescription;
    for (const option of responseType.variants.values()) {
      if (isNullType(option.type)) {
        continue;
      }

      processResponseType(
        program,
        diagnostics,
        operation,
        responses,
        option.type,
        inlineDocNodeTreeMap,
        unionDescription,
      );
    }
    return;
  }

  // Get body
  let { body: resolvedBody, metadata } = diagnostics.pipe(
    resolveHttpPayload(program, responseType, Visibility.Read, HttpPayloadDisposition.Response),
  );
  // Get explicity defined status codes
  const statusCodes: HttpStatusCodes = diagnostics.pipe(
    getResponseStatusCodes(program, responseType, metadata),
  );

  // Get response headers
  const headers = getResponseHeaders(program, metadata);

  // If there is no explicit status code, check if it should be 204
  if (statusCodes.length === 0) {
    if (isErrorModel(program, responseType)) {
      statusCodes.push("*");
    } else if (isVoidType(responseType)) {
      resolvedBody = undefined;
      statusCodes.push(204); // Only special case for 204 is op test(): void;
    } else if (resolvedBody === undefined || isVoidType(resolvedBody.type)) {
      resolvedBody = undefined;
      statusCodes.push(200);
    } else {
      statusCodes.push(200);
    }
  }

  // Put them into currentEndpoint.responses
  for (const statusCode of statusCodes) {
    // the first model for this statusCode/content type pair carries the
    // description for the endpoint. This could probably be improved.
    const response: HttpOperationResponse = responses.get(statusCode) ?? {
      statusCodes: statusCode,
      type: responseType,
      description: getResponseDescription(
        program,
        operation,
        responseType,
        statusCode,
        metadata,
        inlineDocNodeTreeMap,
        parentDescription,
      ),
      responses: [],
    };

    if (resolvedBody !== undefined) {
      response.responses.push({
        body: resolvedBody,
        headers,
        properties: metadata,
      });
    } else {
      response.responses.push({ headers, properties: metadata });
    }
    responses.set(statusCode, response);
  }
}

/**
 * Get explicity defined status codes from response type and metadata
 * Return is an array of strings, possibly empty, which indicates no explicitly defined status codes.
 * We do not check for duplicates here -- that will be done by the caller.
 */
function getResponseStatusCodes(
  program: Program,
  responseType: Type,
  metadata: HttpProperty[],
): [HttpStatusCodes, readonly Diagnostic[]] {
  const codes: HttpStatusCodes = [];
  const diagnostics = createDiagnosticCollector();

  let statusFound = false;
  for (const prop of metadata) {
    if (prop.kind === "statusCode") {
      if (statusFound) {
        reportDiagnostic(program, {
          code: "multiple-status-codes",
          target: responseType,
        });
      }
      statusFound = true;
      codes.push(...diagnostics.pipe(getStatusCodesWithDiagnostics(program, prop.property)));
    }
  }

  // This is only needed to retrieve the * status code set by @defaultResponse.
  // https://github.com/microsoft/typespec/issues/2485
  if (responseType.kind === "Model") {
    for (let t: Model | undefined = responseType; t; t = t.baseModel) {
      codes.push(...getExplicitSetStatusCode(program, t));
    }
  }

  return diagnostics.wrap(codes);
}

function getExplicitSetStatusCode(program: Program, entity: Model | ModelProperty): "*"[] {
  return program.stateMap(HttpStateKeys.statusCode).get(entity) ?? [];
}

/**
 * Get response headers from response metadata
 */
function getResponseHeaders(
  program: Program,
  metadata: HttpProperty[],
): Record<string, ModelProperty> {
  const responseHeaders: Record<string, ModelProperty> = {};
  for (const prop of metadata) {
    if (prop.kind === "header") {
      responseHeaders[prop.options.name] = prop.property;
    }
  }
  return responseHeaders;
}

function isResponseEnvelope(metadata: HttpProperty[]): boolean {
  return metadata.some(
    (prop) =>
      prop.kind === "body" ||
      prop.kind === "bodyRoot" ||
      prop.kind === "multipartBody" ||
      prop.kind === "statusCode",
  );
}

function getResponseDescription(
  program: Program,
  operation: Operation,
  responseType: Type,
  statusCode: HttpStatusCodes[number],
  metadata: HttpProperty[],
  inlineDocNodeTreeMap: InlineDocNodeTreeMap,
  parentDescription?: string,
): string | undefined {
  // If an inline doc comment provided, use that first
  const inlineDescription = getNearestInlineDescriptionFromOperationReturnTypeNode(
    inlineDocNodeTreeMap,
    responseType.node,
  );
  if (inlineDescription) {
    return inlineDescription;
  }

  // If a parent union provided a description, use that second
  if (parentDescription) {
    return parentDescription;
  }

  // NOTE: If the response type is an envelope and not the same as the body
  // type, then use its @doc as the response description. However, if the
  // response type is the same as the body type, then use the default status
  // code description and don't duplicate the schema description of the body
  // as the response description. This allows more freedom to change how
  // TypeSpec is expressed in semantically equivalent ways without causing
  // the output to change unnecessarily.
  if (isResponseEnvelope(metadata)) {
    const desc = getDoc(program, responseType);
    if (desc) {
      return desc;
    }
  }

  const desc = isErrorModel(program, responseType)
    ? getErrorsDoc(program, operation)
    : getReturnsDoc(program, operation);
  if (desc) {
    return desc;
  }

  return getStatusCodeDescription(statusCode);
}

/**
 * Maps nodes to their semantic parents for tracling inline doc comment inheritance.
 * It close to the concept of Concrete Syntax Tree (CST).
 *
 * Unlike AST parent relationships which reflect syntax structure, this map tracks
 * semantic relationships after type resolution to enable proper doc comment
 * inheritance through aliases, unions, and other TypeSpec constructs.
 *
 * The key is a {@link Node}, and the value is its semantic parent {@link Node} or `null` if none exists.
 * It means that is a root {@link Node} if the value is `null`.
 */
interface InlineDocNodeTreeMap extends WeakMap<Node, Node | null> {}

/**
 * Collect inline doc comments from response type node by traversing the tree.
 * This operation should do only once per operation due to it can traverse
 * by the given {@link Operation.returnType}'s node.
 */
function generateInlineDocNodeTreeMap(
  program: Program,
  operation: Operation,
): InlineDocNodeTreeMap {
  let node = operation.returnType.node;
  // if the return type node of operation is a single type reference, which doesn't appear in AST
  // about operation.returnType.node
  // so we need to get the actual type reference node from operation signature's return type
  if (
    operation.node?.kind === SyntaxKind.OperationStatement &&
    operation.node.signature.kind === SyntaxKind.OperationSignatureDeclaration
  ) {
    node = operation.node.signature.returnType;
  }

  const map: InlineDocNodeTreeMap = new WeakMap();
  if (node?.kind === SyntaxKind.UnionExpression) {
    traverseUnionExpression(program, map, node, null);
  }
  if (node?.kind === SyntaxKind.ArrayExpression) {
    traverseArrayExpression(program, map, node, null);
  }
  if (node?.kind === SyntaxKind.TypeReference) {
    traverseTypeReference(program, map, node, null);
  }
  return map;
}

/**
 * This function traverse up the tree from the given resolved response type node
 * which is the bottom of the traversal.
 * Return the nearest inline description from the {@link Operation.returnType}'s node.
 */
function getNearestInlineDescriptionFromOperationReturnTypeNode(
  map: InlineDocNodeTreeMap,
  node?: Node,
  nearestNodeHasDoc?: Node,
): string | null {
  // this branch couldn't happen normally
  if (!node) return null;
  const parentNode = map.get(node);
  const nodeText = getLastDocText(node);
  // if no parent, stop traversing and return the description
  if (!parentNode) {
    // if root node has no description, return the description
    // from nearest node which could have inline doc comment
    if (!nodeText && nearestNodeHasDoc) {
      return getLastDocText(nearestNodeHasDoc);
    }
    // no parent and no nearest node with doc, return the description
    // from current node which could have inline doc comment
    return nodeText;
  }

  const parentNodeText = getLastDocText(parentNode);
  if (map.has(parentNode)) {
    // if parent has no description and current node has description,
    // keep current node as nearestNodeHasDoc which could have inline doc comment
    if (!parentNodeText && nodeText) {
      return getNearestInlineDescriptionFromOperationReturnTypeNode(map, parentNode, node);
    }
    // keep nearestNodeHasDoc as nearest node which could have inline doc comment
    return getNearestInlineDescriptionFromOperationReturnTypeNode(
      map,
      parentNode,
      nearestNodeHasDoc,
    );
  }
  return null;
}

function traverseTypeReference(
  program: Program,
  map: InlineDocNodeTreeMap,
  node: TypeReferenceNode,
  parentNode: Node | null,
): void {
  map.set(node, parentNode);
  const type = program.checker.getTypeForNode(node);
  const ancestorNode = node;

  if (type.node) {
    const childNode = type.node;
    const kind = childNode.kind;
    if (kind === SyntaxKind.UnionExpression) {
      traverseUnionExpression(program, map, childNode, ancestorNode);
    }
    if (kind === SyntaxKind.UnionStatement) {
      traverseUnionStatement(program, map, childNode, ancestorNode);
    }
    if (kind === SyntaxKind.IntersectionExpression) {
      traverseIntersectionExpression(program, map, childNode, ancestorNode);
    }
    if (
      kind === SyntaxKind.ModelStatement ||
      kind === SyntaxKind.ModelExpression ||
      kind === SyntaxKind.ScalarStatement
    ) {
      map.set(childNode, ancestorNode);
    }
  }
}

function traverseUnionExpression(
  program: Program,
  map: InlineDocNodeTreeMap,
  node: UnionExpressionNode,
  parentNode: Node | null,
): void {
  for (const option of node.options) {
    if (option.kind === SyntaxKind.TypeReference) {
      traverseTypeReference(program, map, option, parentNode);
    }
    if (option.kind === SyntaxKind.ArrayExpression) {
      traverseArrayExpression(program, map, option, parentNode);
    }
    if (option.kind === SyntaxKind.IntersectionExpression) {
      traverseIntersectionExpression(program, map, option, parentNode);
    }
    if (option.kind === SyntaxKind.ModelExpression) {
      map.set(option, parentNode);
    }
  }
}

function traverseUnionStatement(
  program: Program,
  map: InlineDocNodeTreeMap,
  node: UnionStatementNode,
  parentNode: Node | null,
) {
  for (const option of node.options) {
    map.set(option, parentNode);

    if (option.kind === SyntaxKind.UnionVariant) {
      if (option.value.kind === SyntaxKind.TypeReference) {
        traverseTypeReference(program, map, option.value, parentNode);
      }
      if (option.value.kind === SyntaxKind.ModelExpression) {
        map.set(option.value, parentNode);
      }
    }
  }
}

function traverseArrayExpression(
  program: Program,
  map: InlineDocNodeTreeMap,
  node: ArrayExpressionNode,
  parentNode: Node | null,
): void {
  map.set(node, parentNode);
  // Array or [] is a reference type, so we need to resolve its original Array model
  const type = program.checker.getTypeForNode(node);

  if (type.node) {
    const childNode = type.node;
    map.set(childNode, node);
    const elementType = node.elementType;
    if (elementType.kind === SyntaxKind.UnionExpression) {
      traverseUnionExpression(program, map, elementType, childNode);
    }
    if (elementType.kind === SyntaxKind.TypeReference) {
      traverseTypeReference(program, map, elementType, childNode);
    }
  }
}

function traverseIntersectionExpression(
  program: Program,
  map: InlineDocNodeTreeMap,
  node: IntersectionExpressionNode,
  parentNode: Node | null,
): void {
  map.set(node, parentNode);

  for (const option of node.options) {
    if (option.kind === SyntaxKind.UnionExpression) {
      traverseUnionExpression(program, map, option, parentNode);
    }
    if (option.kind === SyntaxKind.TypeReference) {
      traverseTypeReference(program, map, option, parentNode);
    }
  }
}

function getLastDocText(node: Node): string | null {
  // the doc node isn't an inline doc comment when it belongs to a model statement
  // this condition should be an allowlist for nodes which can have inline doc comments
  const isAllowedNodeKind =
    node.kind !== SyntaxKind.TypeReference &&
    node.kind !== SyntaxKind.ModelExpression &&
    node.kind !== SyntaxKind.IntersectionExpression &&
    node.kind !== SyntaxKind.ArrayExpression;
  if (isAllowedNodeKind) return null;
  const docs = node.docs;
  if (!docs || docs.length === 0) return null;
  const lastDoc = docs[docs.length - 1];
  return getDocContent(lastDoc.content);
}

/**
 * same as {@link file://./../../compiler/src/core/checker.ts getDocContent}
 */
function getDocContent(content: readonly DocContent[]) {
  const docs = [];
  for (const node of content) {
    compilerAssert(
      node.kind === SyntaxKind.DocText,
      "No other doc content node kinds exist yet. Update this code appropriately when more are added.",
    );
    docs.push(node.text);
  }
  return docs.join("");
}
