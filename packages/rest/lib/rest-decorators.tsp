namespace TypeSpec.Rest;

using TypeSpec.Reflection;

/**
 * This interface or operation should resolve its route automatically. To be used with resource types where the route segments area defined on the models.
 *
 * @example
 *
 * ```typespec
 * @autoRoute
 * interface Pets {
 *   get(@segment("pets") @path id: string): void; //-> route: /pets/{id}
 * }
 * ```
 */
extern dec autoRoute(target: Interface | Operation);

/**
 * Defines the preceding path segment for a @path parameter in auto-generated routes.
 *
 * @param name Segment that will be inserted into the operation route before the path parameter's name field.
 *
 * @example
 * @autoRoute
 * interface Pets {
 *   get(@segment("pets") @path id: string): void; //-> route: /pets/{id}
 * }
 */
extern dec segment(target: Model | ModelProperty | Operation, name: string);

/**
 * Returns the URL segment of a given model if it has `@segment` and `@key` decorator.
 * @param type Target model
 */
extern dec segmentOf(target: Operation, type: Model);

/**
 * Defines the separator string that is inserted before the action name in auto-generated routes for actions.
 *
 * @param seperator Seperator seperating the action segment from the rest of the url
 */
extern dec actionSeparator(target: Model | ModelProperty | Operation, seperator: "/" | ":" | "/:");

/**
 * Mark this model as a resource type with a name.
 *
 * @param collectionName type's collection name
 */
extern dec resource(target: Model, collectionName: string);

/**
 * Specify that this is a Read operation for a given resource.
 *
 * @param resourceType Resource marked with @resource
 */
extern dec readsResource(target: Operation, resourceType: Model);

/**
 * Specify that this is a Create operation for a given resource.
 *
 * @param resourceType Resource marked with @resource
 */
extern dec createsResource(target: Operation, resourceType: Model);

/**
 * Specify that this is a CreateOrReplace operation for a given resource.
 *
 * @param resourceType Resource marked with @resource
 */
extern dec createsOrReplacesResource(target: Operation, resourceType: Model);

/**
 * Specify that this is a CreatesOrUpdate operation for a given resource.
 *
 * @param resourceType Resource marked with @resource
 */
extern dec createsOrUpdatesResource(target: Operation, resourceType: Model);

/**
 * Specify that this is a Update operation for a given resource.
 *
 * @param resourceType Resource marked with @resource
 */
extern dec updatesResource(target: Operation, resourceType: Model);

/**
 * Specify that this is a Delete operation for a given resource.
 *
 * @param resourceType Resource marked with @resource
 */
extern dec deletesResource(target: Operation, resourceType: Model);

/**
 * Specify that this is a List operation for a given resource.
 *
 * @param resourceType Resource marked with @resource
 */
extern dec listsResource(target: Operation, resourceType: Model);

/**
 * Specify this operation is an action. (Scoped to a resource item /pets/{petId}/my-action)
 * @param name Name of the action. If not specified, the name of the operation will be used.
 */
extern dec action(target: Operation, name?: string);

/**
 * Specify this operation is a collection action. (Scopped to a resource, /pets/my-action)
 * @param resourceType Resource marked with @resource
 * @param name Name of the action. If not specified, the name of the operation will be used.
 */
extern dec collectionAction(target: Operation, resourceType: Model, name?: string);

namespace Private {
  extern dec resourceLocation(target: string, resourceType: Model);
}
