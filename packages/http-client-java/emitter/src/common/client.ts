/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import {
  Aspect,
  HttpHeader,
  Metadata,
  OperationGroup,
  Parameter,
  Property,
  Security,
} from "@autorest/codemodel";
import { DeepPartial } from "@azure-tools/codegen";

export interface Client extends Aspect {
  /** All operations  */
  operationGroups: Array<OperationGroup>;

  globalParameters?: Array<Parameter>;

  security: Security;

  serviceVersion?: ServiceVersion; // apiVersions is in

  /**
   * Parent client of this client, if exists.
   */
  parent?: Client;
  /**
   * Sub clients of this client, if exists.
   */
  subClients: Array<Client>;
  /**
   * Whether the Builder class has a public method (e.g. "buildSubClient") to initiate this client.
   */
  buildMethodPublic: boolean;
  /**
   * Whether the parent client has a public accessor method (e.g. "getSubClient") to initiate this client.
   */
  parentAccessorPublic: boolean;
}

export class Client extends Aspect implements Client {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<Client>) {
    super(name, description, objectInitializer);

    this.operationGroups = [];
    this.security = new Security(false);
    this.subClients = [];
    this.buildMethodPublic = true;
    this.parentAccessorPublic = false;

    this.applyTo(this, objectInitializer);
  }

  private get globals(): Array<Parameter> {
    return this.globalParameters || (this.globalParameters = []);
  }

  addGlobalParameters(parameters: Parameter[]) {
    this.globals.push(...parameters);
  }

  addSubClient(subClient: Client) {
    subClient.parent = this;
    subClient.buildMethodPublic = false;
    subClient.parentAccessorPublic = true;
    this.subClients.push(subClient);

    // at present, sub client must have same namespace of its parent client
    subClient.language.java!.namespace = this.language.java!.namespace;
  }
}

export class ServiceVersion extends Metadata {
  constructor(name: string, description: string, initializer?: DeepPartial<ServiceVersion>) {
    super();
    this.apply(
      {
        language: {
          default: {
            name: name,
            description: description,
          },
        },
      },
      initializer,
    );
  }
}

export interface EncodedSchema {
  /**
   * The encoded type -- the type on wire.
   * E.g., the type for SDK maybe "int32", but type on wire be "string".
   */
  encode?: string;
}

export class PageableContinuationToken {
  /**
   * The parameter of the operation as continuationToken in API request.
   */
  parameter: Parameter;
  // responseProperty and responseHeader is mutually exclusive
  /**
   * The reference to response body property of the operation as continuationToken in API request.
   * Array because the property may be at "links.nextToken".
   */
  responseProperty?: Array<Property>;
  /**
   * The reference to response header of the operation as continuationToken in API request.
   */
  responseHeader?: HttpHeader;

  constructor(parameter: Parameter, responseProperty?: Property[], responseHeader?: HttpHeader) {
    this.parameter = parameter;
    this.responseProperty = responseProperty;
    this.responseHeader = responseHeader;
  }
}
