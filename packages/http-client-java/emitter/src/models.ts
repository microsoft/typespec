import { ApiVersions, Parameter } from "@autorest/codemodel";
import { ModelProperty, Namespace, Operation, Program } from "@typespec/compiler";
import { findVersionedNamespace, getVersions, Version } from "@typespec/versioning";
import {
  getFilteredApiVersions,
  InconsistentVersions,
  isVersionEarlierThan,
  isVersionedByDate,
} from "./versioning-utils.js";

export class ClientContext {
  program: Program;
  baseUri: string;
  hostParameters: Parameter[];
  globalParameters: Parameter[];
  apiVersions: string[] | InconsistentVersions.MixedVersions | undefined;
  excludePreview: boolean;
  ignoredOperations: Set<Operation>;

  constructor(
    program: Program,
    baseUri: string,
    hostParameters: Parameter[],
    globalParameters: Parameter[],
    apiVersions: ApiVersions | InconsistentVersions.MixedVersions | undefined,
    excludePreview: boolean,
  ) {
    this.program = program;
    this.baseUri = baseUri;
    this.hostParameters = hostParameters;
    this.globalParameters = globalParameters;
    this.apiVersions =
      apiVersions === InconsistentVersions.MixedVersions
        ? InconsistentVersions.MixedVersions
        : apiVersions?.map((it) => it.version);
    this.excludePreview = excludePreview;
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

  getAddedVersions(property: ModelProperty | undefined, versions: Version[]): string[] | undefined {
    let serviceApiVersions: string[] | undefined;
    if (this.apiVersions === InconsistentVersions.MixedVersions) {
      // retrieve and filter api-versions for the service namespace of this model property
      serviceApiVersions = this.getFilteredApiVersionsForProperty(property);
    } else {
      serviceApiVersions = this.apiVersions;
    }

    // currently only allow one added version
    const addedVersions: string[] = [];
    const addedVersion = versions.shift()!.value;
    if (serviceApiVersions) {
      let includeVersion = false;
      for (const version of serviceApiVersions) {
        if (version === addedVersion) {
          includeVersion = true;
        }
        if (includeVersion) {
          addedVersions.push(version);
        }
      }

      if (addedVersions.length === 0 && isVersionedByDate(addedVersion)) {
        // try again with versioning by YYYY-MM-DD(-preview)
        // this logic is for the scenario that the client has api-versions like "2020-01-01", "2021-01-01" and the addedVersion is "2020-09-01-preview", which is excluded due to it being a preview
        let includeVersion = false;
        for (const version of serviceApiVersions) {
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
    } else if (addedVersions.length === serviceApiVersions?.length) {
      // it is added in the 1st api-version, this is the default scenario, no need to specify addedVersions
      return undefined;
    } else {
      return addedVersions;
    }
  }

  // this method is only used when the client has mixed api-versions
  // in this scenario, targetApiVersion is just the latest api-version of the service namespace
  getFilteredApiVersionsForProperty(property: ModelProperty | undefined): string[] | undefined {
    if (property && property.model && property.model.namespace) {
      const versionedNamespace: Namespace | undefined = findVersionedNamespace(
        this.program,
        property.model.namespace,
      );
      if (versionedNamespace) {
        const versions =
          getVersions(this.program, versionedNamespace)[1]?.getVersions() ?? undefined;
        if (versions) {
          return getFilteredApiVersions(
            this.program,
            versions[versions.length - 1].value,
            versions,
            this.excludePreview,
          ).map((v) => v.value);
        }
      }
    }
    return undefined;
  }
}
