import {
  $access,
  $alternateType,
  $apiVersion,
  $client,
  $clientApiVersions,
  $clientDefaultValue,
  $clientDoc,
  $clientInitialization,
  $clientLocation,
  $clientName,
  $clientNamespace,
  $clientOption,
  $convenientAPI,
  $deserializeEmptyStringAsNull,
  $disablePageable,
  $flattenProperty,
  $legacyHierarchyBuilding,
  $markAsLro,
  $markAsPageable,
  $nextLinkVerb,
  $operationGroup,
  $override,
  $paramAlias,
  $protocolAPI,
  $responseAsBool,
  $scope,
  $usage,
  $useSystemTextJsonConverter,
} from "./decorators.js";
import { addParameter, removeParameter, reorderParameters, replaceParameter } from "./functions.js";

export { $lib } from "./lib.js";
export { $onValidate } from "./validate.js";

/** @internal */
export const $decorators = {
  "TypeSpec.ClientGenerator.Core": {
    clientName: $clientName,
    convenientAPI: $convenientAPI,
    protocolAPI: $protocolAPI,
    client: $client,
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    operationGroup: $operationGroup,
    usage: $usage,
    access: $access,
    override: $override,
    useSystemTextJsonConverter: $useSystemTextJsonConverter,
    clientInitialization: $clientInitialization,
    paramAlias: $paramAlias,
    apiVersion: $apiVersion,
    clientNamespace: $clientNamespace,
    alternateType: $alternateType,
    scope: $scope,
    clientApiVersions: $clientApiVersions,
    deserializeEmptyStringAsNull: $deserializeEmptyStringAsNull,
    responseAsBool: $responseAsBool,
    clientDoc: $clientDoc,
    clientLocation: $clientLocation,
    clientOption: $clientOption,
  },

  "TypeSpec.ClientGenerator.Core.Legacy": {
    hierarchyBuilding: $legacyHierarchyBuilding,
    flattenProperty: $flattenProperty,
    markAsLro: $markAsLro,
    markAsPageable: $markAsPageable,
    disablePageable: $disablePageable,
    nextLinkVerb: $nextLinkVerb,
    clientDefaultValue: $clientDefaultValue,
  },
};

/** @internal */
export const $functions: Record<string, Record<string, Function>> = {
  "TypeSpec.ClientGenerator.Core": {
    replaceParameter: replaceParameter,
    removeParameter: removeParameter,
    addParameter: addParameter,
    reorderParameters: reorderParameters,
  },
};
