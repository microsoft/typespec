import { TypeSpecRestDecorators } from "../generated-defs/TypeSpec.Rest.js";
import { $copyResourceKeyParameters, $parentResource } from "./resource.js";
import {
  $action,
  $actionSeparator,
  $autoRoute,
  $collectionAction,
  $createsOrReplacesResource,
  $createsOrUpdatesResource,
  $createsResource,
  $deletesResource,
  $listsResource,
  $readsResource,
  $resource,
  $segment,
  $segmentOf,
  $updatesResource,
} from "./rest.js";

export { $lib } from "./lib.js";
export { $onValidate } from "./validate.js";

/** @internal */
export const $decorators = {
  "TypeSpec.Rest": {
    autoRoute: $autoRoute,
    segment: $segment,
    segmentOf: $segmentOf,
    actionSeparator: $actionSeparator,
    resource: $resource,
    parentResource: $parentResource,
    readsResource: $readsResource,
    createsResource: $createsResource,
    createsOrReplacesResource: $createsOrReplacesResource,
    createsOrUpdatesResource: $createsOrUpdatesResource,
    updatesResource: $updatesResource,
    deletesResource: $deletesResource,
    listsResource: $listsResource,
    action: $action,
    collectionAction: $collectionAction,
    copyResourceKeyParameters: $copyResourceKeyParameters,
  } satisfies TypeSpecRestDecorators,
};
