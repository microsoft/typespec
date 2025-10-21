import { ApiVersions, Parameter } from "@autorest/codemodel";
import { Operation } from "@typespec/compiler";
import { Version } from "@typespec/versioning";
import { isVersionEarlierThan, isVersionedByDate } from "./versioning-utils.js";

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
    apiVersions?: ApiVersions,
  ) {
    this.baseUri = baseUri;
    this.hostParameters = hostParameters;
    this.globalParameters = globalParameters;
    this.apiVersions = apiVersions?.map((it) => it.version);
    this.ignoredOperations = new Set<Operation>();
  }

  addGlobalParameter(parameter: Parameter) {
    if (
      !this.globalParameters.includes(parameter) &&
      !this.globalParameters.some(
        (it) => it.language.default.name === parameter.language.default.name,
      )
    ) {
      this.globalParameters.push(parameter);
    }
  }

  getAddedVersions(versions: Version[]): string[] | undefined {
    // currently only allow one added version
    let addedVersions: string[] = [];
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

      if (addedVersions.length === 0 && isVersionedByDate(addedVersion)) {
        // try again with versioning by YYYY-MM-DD(-preview)
        let includeVersion = false;
        for (const version of this.apiVersions) {
          if (isVersionedByDate(version) && isVersionEarlierThan(addedVersion, version)) {
            includeVersion = true;
          }
          if (includeVersion) {
            addedVersions.push(version);
          }
        }
      }
    }

    if (addedVersions.length === 0) {
      // could not find matching version in client apiVersions
      return undefined;
    } else {
      return addedVersions;
    }
  }
}
