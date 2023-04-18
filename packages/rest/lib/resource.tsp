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

@doc("Dynamically gathers keys of the model type T.")
@copyResourceKeyParameters
@friendlyName("{name}Key", T)
model KeysOf<T> {}

@doc("Dynamically gathers parent keys of the model type T.")
@copyResourceKeyParameters("parent")
@friendlyName("{name}ParentKey", T)
model ParentKeysOf<T> {}

@doc("Represents operation parameters for resource TResource.")
model ResourceParameters<TResource extends {}> {
  ...KeysOf<TResource>;
}

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
  @autoRoute
  @doc("Gets an instance of the resource.")
  @readsResource(TResource)
  get(...ResourceParameters<TResource>): TResource | TError;
}

@doc("Resource create operation completed successfully.")
model ResourceCreatedResponse<T> {
  ...CreatedResponse;
  @body body: T;
}

interface ResourceCreateOrReplace<TResource extends {}, TError> {
  @autoRoute
  @doc("Creates or replaces a instance of the resource.")
  @createsOrReplacesResource(TResource)
  createOrReplace(
    ...ResourceParameters<TResource>,
    @body resource: ResourceCreateModel<TResource>
  ): TResource | ResourceCreatedResponse<TResource> | TError;
}

@friendlyName("{name}Update", TResource)
model ResourceCreateOrUpdateModel<TResource extends {}>
  is OptionalProperties<UpdateableProperties<DefaultKeyVisibility<TResource, "read">>>;

interface ResourceCreateOrUpdate<TResource extends {}, TError> {
  @autoRoute
  @doc("Creates or update a instance of the resource.")
  @createsOrUpdatesResource(TResource)
  createOrUpdate(
    ...ResourceParameters<TResource>,
    @body resource: ResourceCreateOrUpdateModel<TResource>
  ): TResource | ResourceCreatedResponse<TResource> | TError;
}

@friendlyName("{name}Create", TResource)
model ResourceCreateModel<TResource extends {}>
  is UpdateableProperties<DefaultKeyVisibility<TResource, "read">>;

interface ResourceCreate<TResource extends {}, TError> {
  @autoRoute
  @doc("Creates a new instance of the resource.")
  @createsResource(TResource)
  create(
    ...ResourceCollectionParameters<TResource>,
    @body resource: ResourceCreateModel<TResource>
  ): TResource | ResourceCreatedResponse<TResource> | TError;
}

@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface ResourceUpdate<TResource extends {}, TError> {
  @autoRoute
  @doc("Updates an existing instance of the resource.")
  @updatesResource(TResource)
  update(
    ...ResourceParameters<TResource>,
    @body properties: ResourceCreateOrUpdateModel<TResource>
  ): TResource | TError;
}

@doc("Resource deleted successfully.")
model ResourceDeletedResponse {
  @doc("The status code.")
  @statusCode
  _: 200;
}

@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface ResourceDelete<TResource extends {}, TError> {
  @autoRoute
  @doc("Deletes an existing instance of the resource.")
  @deletesResource(TResource)
  delete(...ResourceParameters<TResource>): ResourceDeletedResponse | TError;
}

/**
 * Structure for a paging response using `value` and `nextLink` to represent pagination.
 * This only provides the model structure and not actual pagination support.
 * See https://github.com/microsoft/typespec/issues/705 for general paging support.
 */
@doc("Paged response of {name} items", T)
@friendlyName("{name}CollectionWithNextLink", T)
model CollectionWithNextLink<T extends {}> {
  @doc("The items on this page")
  value: T[];

  @doc("The link to the next page of items")
  nextLink?: ResourceLocation<T>;
}

interface ResourceList<TResource extends {}, TError> {
  @autoRoute
  @doc("Lists all instances of the resource.")
  @listsResource(TResource)
  list(...ResourceCollectionParameters<TResource>): CollectionWithNextLink<TResource> | TError;
}

@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface ResourceInstanceOperations<TResource extends {}, TError>
  extends ResourceRead<TResource, TError>,
    ResourceUpdate<TResource, TError>,
    ResourceDelete<TResource, TError> {}

@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface ResourceCollectionOperations<TResource extends {}, TError>
  extends ResourceCreate<TResource, TError>,
    ResourceList<TResource, TError> {}

@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface ResourceOperations<TResource extends {}, TError>
  extends ResourceInstanceOperations<TResource, TError>,
    ResourceCollectionOperations<TResource, TError> {}

@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface SingletonResourceRead<TSingleton extends {}, TResource extends {}, TError> {
  @autoRoute
  @doc("Gets the singleton resource.")
  @segmentOf(TSingleton)
  @readsResource(TSingleton)
  Get(...ResourceParameters<TResource>): TSingleton | TError;
}

@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface SingletonResourceUpdate<TSingleton extends {}, TResource extends {}, TError> {
  @autoRoute
  @doc("Updates the singleton resource.")
  @segmentOf(TSingleton)
  @updatesResource(TSingleton)
  Update(
    ...ResourceParameters<TResource>,

    @body
    properties: ResourceCreateOrUpdateModel<TSingleton>
  ): TSingleton | TError;
}

interface SingletonResourceOperations<TSingleton extends {}, TResource extends {}, TError>
  extends SingletonResourceRead<TSingleton, TResource, TError>,
    SingletonResourceUpdate<TSingleton, TResource, TError> {}

@Private.validateHasKey(TResource)
@Private.validateIsError(TError)
interface ExtensionResourceRead<TExtension extends {}, TResource extends {}, TError> {
  @autoRoute
  @doc("Gets an instance of the extension resource.")
  @readsResource(TExtension)
  Get(...ResourceParameters<TResource>, ...ResourceParameters<TExtension>): TExtension | TError;
}

interface ExtensionResourceCreateOrUpdate<TExtension extends {}, TResource extends {}, TError> {
  @autoRoute
  @doc("Creates or update a instance of the extension resource.")
  @createsOrUpdatesResource(TExtension)
  CreateOrUpdate(
    ...ResourceParameters<TResource>,
    ...ResourceParameters<TExtension>,
    @body resource: ResourceCreateOrUpdateModel<TExtension>
  ): TExtension | ResourceCreatedResponse<TExtension> | TError;
}

interface ExtensionResourceCreate<TExtension extends {}, TResource extends {}, TError> {
  @autoRoute
  @doc("Creates a new instance of the extension resource.")
  @createsResource(TExtension)
  Create(
    ...ResourceParameters<TResource>,
    @body resource: ResourceCreateModel<TExtension>
  ): TExtension | ResourceCreatedResponse<TExtension> | TError;
}

interface ExtensionResourceUpdate<TExtension extends {}, TResource extends {}, TError> {
  @autoRoute
  @doc("Updates an existing instance of the extension resource.")
  @updatesResource(TExtension)
  Update(
    ...ResourceParameters<TResource>,
    ...ResourceParameters<TExtension>,

    @body
    properties: ResourceCreateOrUpdateModel<TExtension>
  ): TExtension | TError;
}

interface ExtensionResourceDelete<TExtension extends {}, TResource extends {}, TError> {
  @autoRoute
  @doc("Deletes an existing instance of the extension resource.")
  @deletesResource(TExtension)
  Delete(
    ...ResourceParameters<TResource>,
    ...ResourceParameters<TExtension>
  ): ResourceDeletedResponse | TError;
}

interface ExtensionResourceList<TExtension extends {}, TResource extends {}, TError> {
  @autoRoute
  @doc("Lists all instances of the extension resource.")
  @listsResource(TExtension)
  List(
    ...ResourceParameters<TResource>,
    ...ResourceCollectionParameters<TExtension>
  ): CollectionWithNextLink<TExtension> | TError;
}

interface ExtensionResourceInstanceOperations<TExtension extends {}, TResource extends {}, TError>
  extends ExtensionResourceRead<TExtension, TResource, TError>,
    ExtensionResourceUpdate<TExtension, TResource, TError>,
    ExtensionResourceDelete<TExtension, TResource, TError> {}

interface ExtensionResourceCollectionOperations<TExtension extends {}, TResource extends {}, TError>
  extends ExtensionResourceCreate<TExtension, TResource, TError>,
    ExtensionResourceList<TExtension, TResource, TError> {}

interface ExtensionResourceOperations<TExtension extends {}, TResource extends {}, TError>
  extends ExtensionResourceInstanceOperations<TExtension, TResource, TError>,
    ExtensionResourceCollectionOperations<TExtension, TResource, TError> {}
