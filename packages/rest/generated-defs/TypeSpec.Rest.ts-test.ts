/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import {
  $action,
  $actionSeparator,
  $autoRoute,
  $collectionAction,
  $copyResourceKeyParameters,
  $createsOrReplacesResource,
  $createsOrUpdatesResource,
  $createsResource,
  $deletesResource,
  $listsResource,
  $parentResource,
  $readsResource,
  $resource,
  $segment,
  $segmentOf,
  $updatesResource,
} from "@typespec/rest";
import type {
  ActionDecorator,
  ActionSeparatorDecorator,
  AutoRouteDecorator,
  CollectionActionDecorator,
  CopyResourceKeyParametersDecorator,
  CreatesOrReplacesResourceDecorator,
  CreatesOrUpdatesResourceDecorator,
  CreatesResourceDecorator,
  DeletesResourceDecorator,
  ListsResourceDecorator,
  ParentResourceDecorator,
  ReadsResourceDecorator,
  ResourceDecorator,
  SegmentDecorator,
  SegmentOfDecorator,
  UpdatesResourceDecorator,
} from "./TypeSpec.Rest.js";

type Decorators = {
  $autoRoute: AutoRouteDecorator;
  $segment: SegmentDecorator;
  $segmentOf: SegmentOfDecorator;
  $actionSeparator: ActionSeparatorDecorator;
  $resource: ResourceDecorator;
  $parentResource: ParentResourceDecorator;
  $readsResource: ReadsResourceDecorator;
  $createsResource: CreatesResourceDecorator;
  $createsOrReplacesResource: CreatesOrReplacesResourceDecorator;
  $createsOrUpdatesResource: CreatesOrUpdatesResourceDecorator;
  $updatesResource: UpdatesResourceDecorator;
  $deletesResource: DeletesResourceDecorator;
  $listsResource: ListsResourceDecorator;
  $action: ActionDecorator;
  $collectionAction: CollectionActionDecorator;
  $copyResourceKeyParameters: CopyResourceKeyParametersDecorator;
};

/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: Decorators = {
  $autoRoute,
  $segment,
  $segmentOf,
  $actionSeparator,
  $resource,
  $parentResource,
  $readsResource,
  $createsResource,
  $createsOrReplacesResource,
  $createsOrUpdatesResource,
  $updatesResource,
  $deletesResource,
  $listsResource,
  $action,
  $collectionAction,
  $copyResourceKeyParameters,
};
