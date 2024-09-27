import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.ResourceManager;
using TypeSpec.OpenAPI;
using Azure.ClientGenerator.Core;

@armProviderNamespace
@service({
  title: "ArmResource",
})
@versioned(Versions)
@doc("Arm Resource Provider management API.")
namespace Cadl.ArmResourceProvider;

@doc("Azure API versions.")
enum Versions {
  @useDependency(Azure.Core.Versions.v1_0_Preview_2)
  @useDependency(Azure.ResourceManager.Versions.v1_0_Preview_1)
  @doc("Preview API version 2022-06-01-preview.")
  v2022_06_01_preview: "2022-06-01-preview",

  @useDependency(Azure.Core.Versions.v1_0_Preview_2)
  @useDependency(Azure.ResourceManager.Versions.v1_0_Preview_1)
  @doc("Preview API version 2022-09-01-preview.")
  v2022_09_01_preview: "2022-09-01-preview",

  @useDependency(Azure.Core.Versions.v1_0_Preview_2)
  @useDependency(Azure.ResourceManager.Versions.v1_0_Preview_1)
  @doc("Public API version.")
  v2023_11_01: "2023-11-01",

  @useDependency(Azure.Core.Versions.v1_0_Preview_2)
  @useDependency(Azure.ResourceManager.Versions.v1_0_Preview_1)
  @doc("Preview API version 2023-12-01-preview.")
  v2023_12_01_preview: "2023-12-01-preview",
}

//----------------------- Child Resources -----------------------
@doc("Subresource of Top Level Arm Resource.")
@parentResource(TopLevelArmResource)
model ChildResource is TrackedResource<ChildResourceProperties> {
  @key("childResourceName")
  @doc("ChildResources")
  @visibility("read")
  @path
  @segment("childResources")
  @pattern("^[A-Za-z0-9]([A-Za-z0-9-_.]{0,62}[A-Za-z0-9])?$")
  name: string;
}

@doc("Child Resource Properties.")
model ChildResourceProperties {
  @visibility("read")
  @doc("Provisioning State of Top Level Arm Resource")
  provisioningState?: ProvisioningState;
}

//----------------------- Top Level Arm Resource -----------------------
@resource("topLevelArmResources")
model TopLevelArmResource is TrackedResource<TopLevelArmResourceProperties> {
  @key("topLevelArmResourceName")
  @path
  @segment("topLevelArmResources")
  @doc("arm resource name for path")
  @pattern("^[A-Za-z0-9]([A-Za-z0-9-_.]{0,62}[A-Za-z0-9])?$")
  name: string;
}

@doc("Top Level Arm Resource Properties.")
model TopLevelArmResourceProperties {
  @doc("Configuration Endpoints.")
  @visibility("read")
  configurationEndpoints?: string[];

  userName: string; // this should be renamed to username
  userNames: string; // this isn't a whole word match, shouldn't be renamed to usernames
  accuserName: string; // this isn't a whole word match, shouldn't be renamed to accusername

  @visibility("create", "read")
  startTimeStamp: utcDateTime; // this should be renamed to startTimestamp

  @visibility("read")
  @doc("The status of the last operation.")
  provisioningState?: ProvisioningState;
}

//----------------------- Custom Template Resource -----------------------
@resource("customTemplateResources")
model CustomTemplateResource is TrackedResource<CustomTemplateResourceProperties> {
  @key("customTemplateResourceName")
  @path
  @segment("customTemplateResources")
  @doc("arm resource name for path")
  @pattern("^[A-Za-z0-9]([A-Za-z0-9-_.]{0,62}[A-Za-z0-9])?$")
  name: string;

  #suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-invalid-envelope-property" "https://github.com/Azure/typespec-azure/issues/2840"
  @added(Versions.v2023_11_01)
  @doc("Managed identity.")
  identity?: Azure.ResourceManager.Foundations.ManagedServiceIdentity;
}

@doc("extensible enum type for discriminator")
union DogKind {
  string,

  @doc("Species golden")
  Golden: "golden_dog",
}

@doc("Test extensible enum type for discriminator")
@discriminator("kind")
model Dog {
  @doc("discriminator property")
  kind: DogKind;

  @doc("Weight of the dog")
  weight: int32;
}

@doc("Golden dog model")
model Golden extends Dog {
  @doc("discriminator property")
  kind: DogKind.Golden;
}

@doc("Top Level Arm Resource Properties.")
model CustomTemplateResourceProperties {
  @visibility("read")
  @doc("The status of the last operation.")
  provisioningState?: ProvisioningState;

  @added(Versions.v2022_06_01_preview)
  @removed(Versions.v2023_11_01)
  @added(Versions.v2023_12_01_preview)
  propertyRemovedInStable: string;

  dog: Dog;
  namedEmptyModel: EmptyModel;
  anonymousEmptyModel: {};
}

@doc("Empty model.")
model EmptyModel {}

model CustomTemplateResourcePatch {
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-invalid-envelope-property" "https://github.com/Azure/typespec-azure/issues/2840"
  @added(Versions.v2023_11_01)
  @doc("Managed identity.")
  identity?: Azure.ResourceManager.Foundations.ManagedServiceIdentity;

  @added(Versions.v2022_06_01_preview)
  @removed(Versions.v2023_11_01)
  @added(Versions.v2023_12_01_preview)
  propertyRemovedInStable: string;
}

@lroStatus
union ProvisioningState {
  ResourceProvisioningState,
  Provisioning: "Provisioning",
  Updating: "Updating",
  Deleting: "Deleting",
  Accepted: "Accepted",
}

model ResponseWithHeader<T> {
  ...OkResponse;
  ...Azure.Core.Foundations.RetryAfterHeader;
  ...Body<T>;
}

model Result {
  reason?: string;
}

// #suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-invalid-envelope-property" "built-in conditional request includes time based conditional headers"
alias IfMatchParameters<T extends Azure.ResourceManager.Foundations.Resource> = {
  @header("If-Match")
  @doc("The request should only proceed if an entity matches this string.")
  ifMatch?: string;
};

alias IfNoneMatchParameters<T extends Azure.ResourceManager.Foundations.Resource> = {
  @header("If-None-Match")
  @doc("The request should only proceed if no entity matches this string.")
  ifNoneMatch?: string;
};

//----------------------- Extension Resource -----------------------
/** ExtensionResource of Top Level Arm Resource. */
@parentResource(TopLevelArmResource)
model ChildExtensionResource is ExtensionResource<ChildExtensionResourceProperties> {
  @key("childExtensionResourceName")
  @doc("ChildExtensionResources")
  @visibility("read")
  @path
  @segment("childExtensionResources")
  @pattern("^[A-Za-z0-9]([A-Za-z0-9-_.]{0,62}[A-Za-z0-9])?$")
  name: string;
}

/** Child ExtensionResource properties. */
model ChildExtensionResourceProperties {
  @visibility("read")
  @doc("Provisioning State of the Resource")
  provisioningState?: ProvisioningState;
}

//----------------------- Paths -----------------------
@armResourceOperations
interface ChildResourcesInterface
  extends ResourceInstanceOperations<ChildResource, ChildResourceProperties> {
  listByTopLevelArmResource is ArmResourceListByParent<ChildResource>;
  actionWithoutBody is ArmResourceActionAsync<ChildResource, void, void>;
}

@armResourceOperations
interface TopLevelArmResourceInterface
  extends TrackedResourceOperations<TopLevelArmResource, TopLevelArmResourceProperties> {
  @operationId("TopLevelArmResourceInterface_Post")
  action is ArmResourceActionAsync<
    TopLevelArmResource,
    void,
    Result,
    Azure.ResourceManager.Foundations.BaseParameters<TopLevelArmResource>
  >;
}

@armResourceOperations
interface CustomTemplateResourceInterface
  extends ResourceCreate<
      CustomTemplateResource,
      Azure.ResourceManager.Foundations.BaseParameters<CustomTemplateResource> &
        IfMatchParameters<CustomTemplateResource> &
        IfNoneMatchParameters<CustomTemplateResource>
    > {
  @sharedRoute
  @added(Versions.v2022_09_01_preview)
  @removed(Versions.v2023_11_01)
  update is ArmResourceUpdateSync<CustomTemplateResource>;

  #suppress "@azure-tools/typespec-azure-core/no-operation-id" "Use operationId to keep same name as deprecated update operation"
  @sharedRoute
  @added(Versions.v2023_11_01)
  @operationId("CustomTemplateResourceInterfaces_Update")
  updateLongRunning is ArmCustomPatchAsync<CustomTemplateResource, CustomTemplateResourcePatch>;
}

interface Operations extends Azure.ResourceManager.Operations {}

@armResourceOperations
interface ChildExtensionResourceInterface
  extends ExtensionResourceOperations<ChildExtensionResource, ChildExtensionResourceProperties> {}

#suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-operation" "This is a valid template"
@autoRoute
@doc("Update a {name}", TResource)
@armResourceCreateOrUpdate(TResource)
@patch
op ArmResourceUpdateSync<
  TResource extends Azure.ResourceManager.Foundations.ArmResource,
  TBaseParameters = Azure.ResourceManager.Foundations.BaseParameters<TResource>
>(
  ...ResourceInstanceParameters<TResource, TBaseParameters>,

  @doc("Resource create parameters.")
  @body
  resource: TResource,
): ResponseWithHeader<TResource> | ErrorResponse;

@@flattenProperty(TrackedResource.properties);
@@flattenProperty(Azure.ResourceManager.Foundations.ResourceUpdateModel.properties);
