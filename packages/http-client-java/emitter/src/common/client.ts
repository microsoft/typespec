import { DeepPartial } from "@azure-tools/codegen";
import { Aspect, Metadata, ObjectSchema, OperationGroup, Parameter, Security } from "@autorest/codemodel";

export interface Client extends Aspect {
  /** All operations  */
  operationGroups: Array<OperationGroup>;

  globalParameters?: Array<Parameter>;

  security: Security;

  serviceVersion?: ServiceVersion; // apiVersions is in

  crossLanguageDefinitionId?: string;
}

export class Client extends Aspect implements Client {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<Client>) {
    super(name, description, objectInitializer);

    this.operationGroups = [];
    this.security = new Security(false);

    this.applyTo(this, objectInitializer);
  }

  private get globals(): Array<Parameter> {
    return this.globalParameters || (this.globalParameters = []);
  }

  addGlobalParameters(parameters: Parameter[]) {
    this.globals.push(...parameters);
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

export class ObjectScheme extends ObjectSchema {
  crossLanguageDefinitionId?: string;
  constructor(name: string, description: string, objectInitializer?: DeepPartial<ObjectSchema>) {
    super(name, description, objectInitializer);
  }
}
