/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { Info, Metadata, OperationGroup, Parameter, Schemas, Security } from "@autorest/codemodel";
import { DeepPartial, enableSourceTracking } from "@azure-tools/codegen";
import { Client } from "./client.js";

/** the model that contains all the information required to generate a service api */
export interface CodeModel extends Metadata {
  /** Code model information */
  info: Info;

  /** All schemas for the model */
  schemas: Schemas;

  /** All operations  */
  operationGroups: Array<OperationGroup>;

  /** all global parameters (ie, ImplementationLocation = client ) */
  globalParameters?: Array<Parameter>;

  security: Security;

  clients: Array<Client>;

  arm?: boolean;
}

export class CodeModel extends Metadata implements CodeModel {
  constructor(title: string, sourceTracking = false, objectInitializer?: DeepPartial<CodeModel>) {
    super();
    // if we are enabling source tracking, then we have to use a proxied version of this
    const $this = sourceTracking ? enableSourceTracking(this) : this;

    $this.info = new Info(title);
    $this.schemas = new Schemas();
    $this.operationGroups = [];
    $this.security = new Security(false);
    $this.clients = [];

    this.applyTo($this, objectInitializer);
  }

  private get globals(): Array<Parameter> {
    return this.globalParameters || (this.globalParameters = []);
  }

  getOperationGroup(group: string) {
    let result = this.operationGroups.find(
      (each) => group.toLowerCase() === each.$key.toLowerCase(),
    );
    if (!result) {
      result = new OperationGroup(group);
      this.operationGroups.push(result);
    }
    return result;
  }

  findGlobalParameter(predicate: (value: Parameter) => boolean) {
    return this.globals.find(predicate);
  }

  addGlobalParameter(parameter: Parameter): Parameter;
  addGlobalParameter(find: (value: Parameter) => boolean, create: () => Parameter): Parameter;
  addGlobalParameter(
    predicateOrParameter: Parameter | ((value: Parameter) => boolean),
    create: ValueOrFactory<Parameter> = <any>undefined,
  ): Parameter {
    try {
      if (typeof predicateOrParameter !== "function") {
        // overload : parameter passed
        this.globals.push(predicateOrParameter);

        return predicateOrParameter;
      }

      // overload : predicate, parameter passed
      let p = this.findGlobalParameter(predicateOrParameter);
      if (!p) {
        this.globals.push((p = realize(create)));
      }
      return p;
    } finally {
      this.globalParameters = sortAscendingInvalidLast(
        this.globals,
        (each) => each.extensions?.["x-ms-priority"],
      );
    }
  }
}

export type ValueOrFactory<T> = T | (() => T);

function realize<T>(f: ValueOrFactory<T>): T {
  return f instanceof Function ? f() : f;
}

function sortAscendingInvalidLast<T>(
  input: Array<T>,
  accessor: (each: T) => number | undefined,
): Array<T> {
  return input.sort((a, b) => {
    const pA = accessor(a) ?? Number.MAX_VALUE;
    const pB = accessor(b) ?? Number.MAX_VALUE;
    return pA - pB;
  });
}
