import { ApiVersions, Parameter } from "@autorest/codemodel";
import { getOperationLink } from "@azure-tools/typespec-azure-core";
import {
  SdkClient,
  SdkContext,
  listOperationGroups,
  listOperationsInOperationGroup,
} from "@azure-tools/typespec-client-generator-core";
import { Operation } from "@typespec/compiler";
import { Version } from "@typespec/versioning";
import { getAccess } from "./type-utils.js";

export class ClientContext {
  baseUri: string;
  hostParameters: Parameter[];
  globalParameters: Parameter[];
  apiVersions?: string[];
  ignoredOperations: Set<Operation>;

  constructor(
    baseUri: string,
    hostParameters: Parameter[],
    globalParameters: Parameter[],
    apiVersions?: ApiVersions
  ) {
    this.baseUri = baseUri;
    this.hostParameters = hostParameters;
    this.globalParameters = globalParameters;
    this.apiVersions = apiVersions?.map((it) => it.version);
    this.ignoredOperations = new Set<Operation>();
  }

  addGlobalParameter(parameter: Parameter) {
    if (!this.globalParameters.includes(parameter)) {
      this.globalParameters.push(parameter);
    }
  }

  getAddedVersions(versions: Version[]): string[] {
    // currently only allow one added version
    const addedVersions: string[] = [];
    const addedVersion = versions.shift()!.value;
    if (this.apiVersions) {
      let includeVersion = false;
      for (const version of this.apiVersions) {
        if (version === addedVersion) {
          includeVersion = true;
        }
        if (includeVersion) {
          addedVersions.push(version);
        }
      }
    }
    return addedVersions;
  }

  preProcessOperations(sdkContext: SdkContext, client: SdkClient) {
    const operationGroups = listOperationGroups(sdkContext, client);
    const operations = listOperationsInOperationGroup(sdkContext, client);
    for (const operation of operations) {
      const opLink = getOperationLink(sdkContext.program, operation, "polling");
      if (opLink && opLink.linkedOperation) {
        const access = getAccess(opLink.linkedOperation);
        if (access !== "public") {
          this.ignoredOperations.add(opLink.linkedOperation);
        }
      }
    }

    for (const operationGroup of operationGroups) {
      const operations = listOperationsInOperationGroup(sdkContext, operationGroup);
      for (const operation of operations) {
        const opLink = getOperationLink(sdkContext.program, operation, "polling");
        if (opLink && opLink.linkedOperation) {
          const access = getAccess(opLink.linkedOperation);
          if (access !== "public") {
            this.ignoredOperations.add(opLink.linkedOperation);
          }
        }
      }
    }
  }
}
