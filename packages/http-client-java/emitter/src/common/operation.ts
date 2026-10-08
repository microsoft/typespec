import type { LongRunningMetadata } from "./long-running-metadata.js";
import type {
  ApiVersion,
  Aspect,
  Metadata,
  ModelOptions,
  Parameter,
  Response,
} from "./schemas/model.js";
import {
  createAspect,
  createMetadata,
  ImplementationLocation,
  initializeMetadata,
  SchemaType,
} from "./schemas/model.js";

/** represents a single callable endpoint with a discrete set of inputs, and any number of output possibilities (responses or exceptions)  */
export interface Operation extends Aspect {
  /**
   * Original Operation ID if present.
   * This can be used to identify the original id of an operation before it is styled.
   * THIS IS NOT the name of the operation that should be used in the generator. Use `.language.default.name` for this
   */
  operationId?: string;

  /** common parameters when there are multiple requests */
  parameters?: Array<Parameter>;

  /** a common filtered list of parameters that is (assumably) the actual method signature parameters */
  signatureParameters?: Array<Parameter>;

  /**
   * Mapping of all the content types available for this operation to the coresponding request.
   */
  requestMediaTypes?: Record<string, Request>;

  /**
   * List of headers that parameters should not handle as parameters but with special logic.
   * See https://github.com/Azure/autorest/tree/main/packages/extensions/modelerfour for configuration `skip-special-headers` to exclude headers.
   */
  specialHeaders?: string[];

  /** the different possibilities to build the request. */
  requests?: Array<Request>;

  /** responses that indicate a successful call */
  responses?: Array<Response>;

  /** responses that indicate a failed call */
  exceptions?: Array<Response>;

  /** the apiVersion to use for a given profile name */
  profile?: Record<string, ApiVersion>;

  /** the name of convenience API */
  convenienceApi?: ConvenienceApi;

  /** generate protocol api or not */
  generateProtocolApi?: boolean;

  /** genrate as internal API */
  internalApi?: boolean;

  /** the long-running operation metadata */
  lroMetadata?: LongRunningMetadata;
}

export interface ConvenienceApi extends Metadata {
  requests?: Array<Request>;

  /**
   * Whether the convenience method returns the significant response headers as a strongly-typed model
   * (opt-in via the "responseHeadersAsModel" client option). Only applicable to data-plane operations
   * that have response headers but no response body.
   */
  responseHeadersAsModel?: boolean;
}

export function createConvenienceApi(
  name: string,
  options?: ModelOptions<ConvenienceApi>,
): ConvenienceApi {
  return initializeMetadata(createAspect(name, ""), options);
}

export interface Request extends Metadata {
  /** the parameter inputs to the operation */
  parameters?: Array<Parameter>;

  /** a filtered list of parameters that is (assumably) the actual method signature parameters */
  signatureParameters?: Array<Parameter>;
}

export function createRequest(options?: ModelOptions<Request>): Request {
  return createMetadata(options);
}

export function createOperation(
  name: string,
  description: string,
  options?: ModelOptions<Operation>,
): Operation {
  return createAspect(name, description, options);
}

export function addParameter(target: Request | Operation, parameter: Parameter): Parameter {
  (target.parameters ??= []).push(parameter);
  updateSignatureParameters(target);
  return parameter;
}

export function updateSignatureParameters(target: Request | Operation) {
  if (target.parameters) {
    target.signatureParameters = target.parameters.filter(
      (parameter) =>
        parameter.schema.type !== SchemaType.Constant &&
        parameter.implementation !== ImplementationLocation.Client &&
        !parameter.groupedBy &&
        !parameter.flattened,
    );
  }
}

/** add a request to the operation */
export function addRequest(operation: Operation, request: Request): Request {
  (operation.requests ??= []).push(request);
  return request;
}

export function addResponse(operation: Operation, response: Response): Response {
  (operation.responses ??= []).push(response);
  return response;
}

export function addException(operation: Operation, response: Response): Response {
  (operation.exceptions ??= []).push(response);
  return response;
}

/** an operation group represents a container around set of operations */
export interface OperationGroup extends Metadata {
  $key: string;
  operations?: Operation[];
}

export function createOperationGroup(name: string): OperationGroup {
  return { ...createAspect(name, ""), $key: name };
}

export function addOperation(group: OperationGroup, operation: Operation): Operation {
  (group.operations ??= []).push(operation);
  return operation;
}
