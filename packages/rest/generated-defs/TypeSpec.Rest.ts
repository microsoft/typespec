import type {
  DecoratorContext,
  Interface,
  Model,
  ModelProperty,
  Operation,
} from "@typespec/compiler";

/**
 * This interface or operation should resolve its route automatically. To be used with resource types where the route segments area defined on the models.
 *
 * @example
 * ```typespec
 * @autoRoute
 * interface Pets {
 *   get(@segment("pets") @path id: string): void; //-> route: /pets/{id}
 * }
 * ```
 */
export type AutoRouteDecorator = (context: DecoratorContext, target: Interface | Operation) => void;

/**
 * Defines the preceding path segment for a
 *
 * @path parameter in auto-generated routes.
 * @param name Segment that will be inserted into the operation route before the path parameter's name field.
 * @example
 *
 *
 * @autoRoute
 * interface Pets {
 * get(
 * @segment ("pets")
 * @path id: string): void; //-> route: /pets/{id}
 * }
 */
export type SegmentDecorator = (
  context: DecoratorContext,
  target: Model | ModelProperty | Operation,
  name: string,
) => void;

/**
 * Returns the URL segment of a given model if it has `@segment` and `@key` decorator.
 *
 * @param type Target model
 */
export type SegmentOfDecorator = (
  context: DecoratorContext,
  target: Operation,
  type: Model,
) => void;

/**
 * Defines the separator string that is inserted before the action name in auto-generated routes for actions.
 *
 * @param seperator Seperator seperating the action segment from the rest of the url
 */
export type ActionSeparatorDecorator = (
  context: DecoratorContext,
  target: Model | ModelProperty | Operation,
  seperator: "/" | ":" | "/:",
) => void;

/**
 * Mark this model as a resource type with a name.
 *
 * @param collectionName type's collection name
 */
export type ResourceDecorator = (
  context: DecoratorContext,
  target: Model,
  collectionName: string,
) => void;

/**
 * Mark model as a child of the given parent resource.
 *
 * @param parent Parent model.
 */
export type ParentResourceDecorator = (
  context: DecoratorContext,
  target: Model,
  parent: Model,
) => void;

/**
 * Specify that this is a Read operation for a given resource.
 *
 * @param resourceType Resource marked with
 * @resource
 *
 *
 */
export type ReadsResourceDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
) => void;

/**
 * Specify that this is a Create operation for a given resource.
 *
 * @param resourceType Resource marked with
 * @resource
 *
 *
 */
export type CreatesResourceDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
) => void;

/**
 * Specify that this is a CreateOrReplace operation for a given resource.
 *
 * @param resourceType Resource marked with
 * @resource
 *
 *
 */
export type CreatesOrReplacesResourceDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
) => void;

/**
 * Specify that this is a CreatesOrUpdate operation for a given resource.
 *
 * @param resourceType Resource marked with
 * @resource
 *
 *
 */
export type CreatesOrUpdatesResourceDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
) => void;

/**
 * Specify that this is a Update operation for a given resource.
 *
 * @param resourceType Resource marked with
 * @resource
 *
 *
 */
export type UpdatesResourceDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
) => void;

/**
 * Specify that this is a Delete operation for a given resource.
 *
 * @param resourceType Resource marked with
 * @resource
 *
 *
 */
export type DeletesResourceDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
) => void;

/**
 * Specify that this is a List operation for a given resource.
 *
 * @param resourceType Resource marked with
 * @resource
 *
 *
 */
export type ListsResourceDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
) => void;

/**
 * Specify this operation is an action. (Scoped to a resource item /pets/{petId}/my-action)
 *
 * @param name Name of the action. If not specified, the name of the operation will be used.
 */
export type ActionDecorator = (context: DecoratorContext, target: Operation, name?: string) => void;

/**
 * Specify this operation is a collection action. (Scopped to a resource, /pets/my-action)
 *
 * @param resourceType Resource marked with
 * @resource
 *
 *
 * @param name Name of the action. If not specified, the name of the operation will be used.
 */
export type CollectionActionDecorator = (
  context: DecoratorContext,
  target: Operation,
  resourceType: Model,
  name?: string,
) => void;

/**
 * Copy the resource key parameters on the model
 *
 * @param filter Filter to exclude certain properties.
 */
export type CopyResourceKeyParametersDecorator = (
  context: DecoratorContext,
  target: Model,
  filter?: string,
) => void;

export type TypeSpecRestDecorators = {
  autoRoute: AutoRouteDecorator;
  segment: SegmentDecorator;
  segmentOf: SegmentOfDecorator;
  actionSeparator: ActionSeparatorDecorator;
  resource: ResourceDecorator;
  parentResource: ParentResourceDecorator;
  readsResource: ReadsResourceDecorator;
  createsResource: CreatesResourceDecorator;
  createsOrReplacesResource: CreatesOrReplacesResourceDecorator;
  createsOrUpdatesResource: CreatesOrUpdatesResourceDecorator;
  updatesResource: UpdatesResourceDecorator;
  deletesResource: DeletesResourceDecorator;
  listsResource: ListsResourceDecorator;
  action: ActionDecorator;
  collectionAction: CollectionActionDecorator;
  copyResourceKeyParameters: CopyResourceKeyParametersDecorator;
};
