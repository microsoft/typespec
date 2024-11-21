/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { Aspect, Metadata, OperationGroup, Parameter, Security } from "@autorest/codemodel";
import { DeepPartial } from "@azure-tools/codegen";

export interface Client extends Aspect, CrossLanguageDefinition {
  /** All operations  */
  operationGroups: Array<OperationGroup>;

  globalParameters?: Array<Parameter>;

  security: Security;

  serviceVersion?: ServiceVersion; // apiVersions is in

  parent?: Client;
  subClients: Array<Client>;
  buildMethodPublic: boolean;
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

export interface CrossLanguageDefinition {
  crossLanguageDefinitionId?: string;
}

export interface EncodedSchema {
  encode?: string;
}
