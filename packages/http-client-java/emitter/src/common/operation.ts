/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import {
  ApiVersion,
  Aspect,
  ImplementationLocation,
  Metadata,
  Parameter,
  Response,
  SchemaType,
} from "@autorest/codemodel";
import { DeepPartial } from "@azure-tools/codegen";
import { CrossLanguageDefinition } from "./client.js";
import { LongRunningMetadata } from "./long-running-metadata.js";

/** represents a single callable endpoint with a discrete set of inputs, and any number of output possibilities (responses or exceptions)  */
export interface Operation extends Aspect, CrossLanguageDefinition {
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

export class ConvenienceApi extends Metadata {
  constructor(name: string, initializer?: DeepPartial<ConvenienceApi>) {
    super();
    this.apply(
      {
        language: {
          default: {
            name: name,
          },
        },
      },
      initializer
    );
  }

  requests?: Array<Request>;
}

export interface Request extends Metadata {
  /** the parameter inputs to the operation */
  parameters?: Array<Parameter>;

  /** a filtered list of parameters that is (assumably) the actual method signature parameters */
  signatureParameters?: Array<Parameter>;
}

export class Request extends Metadata implements Request {
  constructor(initializer?: DeepPartial<Request>) {
    super();
    this.apply(initializer);
  }

  addParameter(parameter: Parameter) {
    (this.parameters = this.parameters || []).push(parameter);
    this.updateSignatureParameters();
    return parameter;
  }

  updateSignatureParameters() {
    if (this.parameters) {
      this.signatureParameters = (this.parameters ?? []).filter(
        (each) =>
          each.schema.type !== SchemaType.Constant &&
          each.implementation !== ImplementationLocation.Client &&
          !each.groupedBy &&
          !each.flattened
      );
    }
  }
}

export class Operation extends Aspect implements Operation {
  constructor($key: string, description: string, initializer?: DeepPartial<Operation>) {
    super($key, description);
    this.apply(initializer);
  }

  /** add a request to the operation */
  addRequest(request: Request) {
    (this.requests = this.requests || []).push(request);
    return request;
  }

  addParameter(parameter: Parameter) {
    (this.parameters = this.parameters || []).push(parameter);
    this.updateSignatureParameters();
    return parameter;
  }

  updateSignatureParameters() {
    if (this.parameters) {
      this.signatureParameters = (this.parameters ?? []).filter(
        (each) =>
          each.schema.type !== SchemaType.Constant &&
          each.implementation !== ImplementationLocation.Client &&
          !each.groupedBy &&
          !each.flattened
      );
    }
  }

  addResponse(response: Response) {
    (this.responses = this.responses || []).push(response);
    return response;
  }
  addException(exception: Response) {
    (this.exceptions = this.exceptions || []).push(exception);
    return exception;
  }
  addProfile(profileName: string, apiVersion: ApiVersion) {
    (this.profile = this.profile || {})[profileName] = apiVersion;
    return this;
  }
}

/** an operation group represents a container around set of operations */
export interface OperationGroup extends Metadata {
  $key: string;
  operations: Array<Operation>;
}

export class OperationGroup extends Metadata implements OperationGroup {
  constructor(name: string, objectInitializer?: DeepPartial<OperationGroup>) {
    super();
    this.$key = name;
    this.apply(objectInitializer);
    this.language.default.name = name;
  }

  addOperation(operation: Operation) {
    (this.operations = this.operations || []).push(operation);
    return operation;
  }
}
