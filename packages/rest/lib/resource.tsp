import "@typespec/http";
import "../dist/src/index.js";
import "../dist/src/internal-decorators.js";

namespace TypeSpec.Rest.Resource;

using TypeSpec.Http;

@doc("The default error response for resource operations.")
model ResourceError {
  @doc("The error code.")
  code: int32;

  @doc("The error message.")
  message: string;
}

/**
 * Dynamically gathers keys of the model type T.
 * @template T The target model.
 */
@doc("Dynamically gathers keys of the model type T.")
@copyResourceKeyParameters
@friendlyName("{name}Key", T)
model KeysOf<T> {}

/**
 * Dynamically gathers parent keys of the model type T.
 * @template T The target model.
 */
@doc("Dynamically gathers parent keys of the model type T.")
@copyResourceKeyParameters("parent")
@friendlyName("{name}ParentKey", T)
model ParentKeysOf<T> {}

/**
 * Represents operation parameters for resource TResource.
 * @template TResource The resource model.
 */
@doc("Represents operation parameters for resource TResource.")
model ResourceParameters<TResource extends {}> {
  ...KeysOf<TResource>;
}

/**
 * Represents collection operation parameters for resource TResource.
 * @template TResource The resource model.
 */
@doc("Represents collection operation parameters for resource TResource.")
model ResourceCollectionParameters<TResource extends {}> {
  ...ParentKeysOf<TResource>;
}

/**
 * Represent the resource GET operation.
 * @template TResource The resource model.
 * @template TError The error response.
 */
@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface ResourceRead<TResource extends {}, TError> {
  /**
   * Gets an instance of the resource.
   * @template TResource The resource model.
   */
  @autoRoute
  @doc("Gets an instance of the resource.")
  @readsResource(TResource)
  get(...ResourceParameters<TResource>): TResource | TError;
}

/**
 * Resource create operation completed successfully.
 * @template T The resource model that was created.
 */
@doc("Resource create operation completed successfully.")
model ResourceCreatedResponse<T> {
  ...CreatedResponse;
  @body body: T;
}

/**
 * Resource create or replace operation template.
 * @template TResource The resource model to create or replace.
 * @template TError The error response.
 */
interface ResourceCreateOrReplace<TResource extends {}, TError> {
  /**
   * Creates or replaces a instance of the resource.
   * @template TResource The resource model to create or replace.
   * @template TError The error response.
   */
  @autoRoute
  @doc("Creates or replaces an instance of the resource.")
  @createsOrReplacesResource(TResource)
  createOrReplace(
    ...ResourceParameters<TResource>,
    @body resource: ResourceCreateModel<TResource>,
  ): TResource | ResourceCreatedResponse<TResource> | TError;
}

/**
 * Resource create or update operation model.
 * @template TResource The resource model to create or update.
 */
@friendlyName("{name}Update", TResource)
model ResourceCreateOrUpdateModel<TResource extends {}>
  is OptionalProperties<UpdateableProperties<DefaultKeyVisibility<TResource, "read">>>;

/**
 * Resource create or update operation template.
 * @template TResource The resource model to create or update.
 * @template TError The error response.
 */
interface ResourceCreateOrUpdate<TResource extends {}, TError> {
  /**
   * Creates or update an instance of the resource.
   * @template TResource The resource model to create or update.
   * @template TError The error response.
   */
  @autoRoute
  @doc("Creates or update an instance of the resource.")
  @createsOrUpdatesResource(TResource)
  createOrUpdate(
    ...ResourceParameters<TResource>,
    @body resource: ResourceCreateOrUpdateModel<TResource>,
  ): TResource | ResourceCreatedResponse<TResource> | TError;
}

/**
 * Resource create operation model.
 * @template TResource The resource model to create.
 */
@friendlyName("{name}Create", TResource)
model ResourceCreateModel<TResource extends {}>
  is UpdateableProperties<DefaultKeyVisibility<TResource, "read">>;

/**
 * Resource create operation template.
 * @template TResource The resource model to create.
 * @template TError The error response.
 */
interface ResourceCreate<TResource extends {}, TError> {
  /**
   * Creates a new instance of the resource.
   * @template TResource The resource model to create.
   * @template TError The error response.
   */
  @autoRoute
  @doc("Creates a new instance of the resource.")
  @createsResource(TResource)
  create(
    ...ResourceCollectionParameters<TResource>,
    @body resource: ResourceCreateModel<TResource>,
  ): TResource | ResourceCreatedResponse<TResource> | TError;
}

/**
 * Resource update operation template.
 * @template TResource The resource model to update.
 * @template TError The error response.
 */
@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface ResourceUpdate<TResource extends {}, TError> {
  /**
   * Updates an existing instance of the resource.
   * @template TResource The resource model to update.
   * @template TError The error response.
   */
  @autoRoute
  @doc("Updates an existing instance of the resource.")
  @updatesResource(TResource)
  update(
    ...ResourceParameters<TResource>,
    @body properties: ResourceCreateOrUpdateModel<TResource>,
  ): TResource | TError;
}

@doc("Resource deleted successfully.")
model ResourceDeletedResponse {
  @doc("The status code.")
  @statusCode
  _: 200;
}

/**
 * Resource delete operation template.
 * @template TResource The resource model to delete.
 * @template TError The error response.
 */
@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface ResourceDelete<TResource extends {}, TError> {
  /**
   * Deletes an existing instance of the resource.
   * @template TResource The resource model to delete.
   * @template TError The error response.
   */
  @autoRoute
  @doc("Deletes an existing instance of the resource.")
  @deletesResource(TResource)
  delete(...ResourceParameters<TResource>): ResourceDeletedResponse | TError;
}

/**
 * Structure for a paging response using `value` and `nextLink` to represent pagination.
 * This only provides the model structure and not actual pagination support.
 * See https://github.com/microsoft/typespec/issues/705 for general paging support.
 * @template T The resource type of the collection.
 */
@doc("Paged response of {name} items", T)
@friendlyName("{name}CollectionWithNextLink", T)
model CollectionWithNextLink<T extends {}> {
  @doc("The items on this page")
  value: T[];

  @doc("The link to the next page of items")
  nextLink?: ResourceLocation<T>;
}

/**
 * Resource list operation template.
 * @template TResource The resource model to list.
 * @template TError The error response.
 */
interface ResourceList<TResource extends {}, TError> {
  /**
   * Lists all instances of the resource.
   * @template TResource The resource model to list.
   * @template TError The error response.
   */
  @autoRoute
  @doc("Lists all instances of the resource.")
  @listsResource(TResource)
  list(...ResourceCollectionParameters<TResource>): CollectionWithNextLink<TResource> | TError;
}

/**
 * Resource operation templates for resource instances.
 * @template TResource The resource model.
 * @template TError The error response.
 */
@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface ResourceInstanceOperations<TResource extends {}, TError>
  extends ResourceRead<TResource, TError>,
    ResourceUpdate<TResource, TError>,
    ResourceDelete<TResource, TError> {}

/**
 * Resource operation templates for resource collections.
 * @template TResource The resource model.
 * @template TError The error response.
 */
@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface ResourceCollectionOperations<TResource extends {}, TError>
  extends ResourceCreate<TResource, TError>,
    ResourceList<TResource, TError> {}

/**
 * Resource operation templates for resources.
 * @template TResource The resource model.
 * @template TError The error response.
 */
@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface ResourceOperations<TResource extends {}, TError>
  extends ResourceInstanceOperations<TResource, TError>,
    ResourceCollectionOperations<TResource, TError> {}

/**
 * Singleton resource read operation template.
 * @template TSingleton The singleton resource model.
 * @template TResource The resource model.
 * @template TError The error response.
 */
@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface SingletonResourceRead<TSingleton extends {}, TResource extends {}, TError> {
  /**
   * Gets the singleton resource.
   * @template TSingleton The singleton resource model.
   * @template TResource The resource model.
   */
  @autoRoute
  @doc("Gets the singleton resource.")
  @segmentOf(TSingleton)
  @readsResource(TSingleton)
  get(...ResourceParameters<TResource>): TSingleton | TError;
}

/**
 * Singleton resource update operation template.
 * @template TSingleton The singleton resource model.
 * @template TResource The resource model.
 * @template TError The error response.
 */
@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface SingletonResourceUpdate<TSingleton extends {}, TResource extends {}, TError> {
  /**
   * Updates the singleton resource.
   * @template TSingleton The singleton resource model.
   * @template TResource The resource model.
   */
  @autoRoute
  @doc("Updates the singleton resource.")
  @segmentOf(TSingleton)
  @updatesResource(TSingleton)
  update(
    ...ResourceParameters<TResource>,

    @body
    properties: ResourceCreateOrUpdateModel<TSingleton>,
  ): TSingleton | TError;
}

/**
 * Singleton resource operation templates for singleton resource instances.
 * @template TSingleton The singleton resource model.
 * @template TResource The resource model.
 * @template TError The error response.
 */
interface SingletonResourceOperations<TSingleton extends {}, TResource extends {}, TError>
  extends SingletonResourceRead<TSingleton, TResource, TError>,
    SingletonResourceUpdate<TSingleton, TResource, TError> {}

/**
 * Extension resource read operation template.
 * @template TExtension The extension resource model.
 * @template TResource The resource model.
 * @template TError The error response.
 */
@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface ExtensionResourceRead<TExtension extends {}, TResource extends {}, TError> {
  /**
   * Gets an instance of the extension resource.
   * @template TExtension The extension resource model.
   * @template TResource The resource model.
   */
  @autoRoute
  @doc("Gets an instance of the extension resource.")
  @readsResource(TExtension)
  get(...ResourceParameters<TResource>, ...ResourceParameters<TExtension>): TExtension | TError;
}

/**
 * Extension resource create or update operation template.
 * @template TExtension The extension resource model.
 * @template TResource The resource model.
 * @template TError The error response.
 */
interface ExtensionResourceCreateOrUpdate<TExtension extends {}, TResource extends {}, TError> {
  /**
   * Creates or update an instance of the extension resource.
   * @template TExtension The extension resource model.
   * @template TResource The resource model.
   */
  @autoRoute
  @doc("Creates or update an instance of the extension resource.")
  @createsOrUpdatesResource(TExtension)
  createOrUpdate(
    ...ResourceParameters<TResource>,
    ...ResourceParameters<TExtension>,
    @body resource: ResourceCreateOrUpdateModel<TExtension>,
  ): TExtension | ResourceCreatedResponse<TExtension> | TError;
}

/**
 * Extension resource create operation template.
 * @template TExtension The extension resource model.
 * @template TResource The resource model.
 * @template TError The error response.
 */
interface ExtensionResourceCreate<TExtension extends {}, TResource extends {}, TError> {
  /**
   * Creates a new instance of the extension resource.
   * @template TExtension The extension resource model.
   * @template TResource The resource model.
   */
  @autoRoute
  @doc("Creates a new instance of the extension resource.")
  @createsResource(TExtension)
  create(
    ...ResourceParameters<TResource>,
    @body resource: ResourceCreateModel<TExtension>,
  ): TExtension | ResourceCreatedResponse<TExtension> | TError;
}

/**
 * Extension resource update operation template.
 * @template TExtension The extension resource model.
 * @template TResource The resource model.
 * @template TError The error response.
 */
interface ExtensionResourceUpdate<TExtension extends {}, TResource extends {}, TError> {
  /**
   * Updates an existing instance of the extension resource.
   * @template TExtension The extension resource model.
   * @template TResource The resource model.
   */
  @autoRoute
  @doc("Updates an existing instance of the extension resource.")
  @updatesResource(TExtension)
  update(
    ...ResourceParameters<TResource>,
    ...ResourceParameters<TExtension>,

    @body
    properties: ResourceCreateOrUpdateModel<TExtension>,
  ): TExtension | TError;
}

/**
 * Extension resource delete operation template.
 * @template TExtension The extension resource model.
 * @template TResource The resource model.
 * @template TError The error response.
 */
interface ExtensionResourceDelete<TExtension extends {}, TResource extends {}, TError> {
  /**
   * Deletes an existing instance of the extension resource.
   * @template TExtension The extension resource model.
   * @template TResource The resource model.
   */
  @autoRoute
  @doc("Deletes an existing instance of the extension resource.")
  @deletesResource(TExtension)
  delete(
    ...ResourceParameters<TResource>,
    ...ResourceParameters<TExtension>,
  ): ResourceDeletedResponse | TError;
}

/**
 * Extension resource list operation template.
 * @template TExtension The extension resource model.
 * @template TResource The resource model.
 * @template TError The error response.
 */
interface ExtensionResourceList<TExtension extends {}, TResource extends {}, TError> {
  /**
   * Lists all instances of the extension resource.
   * @template TExtension The extension resource model.
   * @template TResource The resource model.
   */
  @autoRoute
  @doc("Lists all instances of the extension resource.")
  @listsResource(TExtension)
  list(
    ...ResourceParameters<TResource>,
    ...ResourceCollectionParameters<TExtension>,
  ): CollectionWithNextLink<TExtension> | TError;
}

/**
 * Extension resource operation templates for extension resource instances.
 * @template TExtension The extension resource model.
 * @template TResource The resource model.
 * @template TError The error response.
 */
interface ExtensionResourceInstanceOperations<TExtension extends {}, TResource extends {}, TError>
  extends ExtensionResourceRead<TExtension, TResource, TError>,
    ExtensionResourceUpdate<TExtension, TResource, TError>,
    ExtensionResourceDelete<TExtension, TResource, TError> {}

/**
 * Extension resource operation templates for extension resource collections.
 * @template TExtension The extension resource model.
 * @template TResource The resource model.
 * @template TError The error response.
 */
interface ExtensionResourceCollectionOperations<TExtension extends {}, TResource extends {}, TError>
  extends ExtensionResourceCreate<TExtension, TResource, TError>,
    ExtensionResourceList<TExtension, TResource, TError> {}

/**
 * Extension resource operation templates for extension resource instances and collections.
 * @template TExtension The extension resource model.
 * @template TResource The resource model.
 * @template TError The error response.
 */
interface ExtensionResourceOperations<TExtension extends {}, TResource extends {}, TError>
  extends ExtensionResourceInstanceOperations<TExtension, TResource, TError>,
    ExtensionResourceCollectionOperations<TExtension, TResource, TError> {}
