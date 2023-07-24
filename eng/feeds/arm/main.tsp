import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-providerhub";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.ResourceManager;

@armProviderNamespace
@service({
  title: "{{parameters.ServiceNamespace}} management service",
  version: "2021-10-01-preview",
})
@doc("{{parameters.ServiceNamespace}} Resource Provider management API.")
@useDependency(Azure.ResourceManager.Versions.v1_0_Preview_1)
namespace {{parameters.ServiceNamespace}};

@doc("Employee resource")
model Employee is TrackedResource<EmployeeProperties> {
  @doc("Name of employee")
  @pattern("^[a-zA-Z0-9-]{3,24}$")
  @key("employeeName")
  @path
  @segment("employees")
  name: string;
}

@doc("Employee properties")
model EmployeeProperties {
  @doc("Age of employee")
  age?: int32;

  @doc("City of employee")
  city?: string;

  @doc("Profile of employee")
  @encode("base64url")
  profile?: bytes;

  @visibility("read")
  @doc("The status of the last operation.")
  provisioningState?: ProvisioningState;
}

@lroStatus
@doc("The resource provisioning state.")
enum ProvisioningState {
  ...ResourceProvisioningState,
  @doc("The resource is being provisioned.")
  Provisioning,
  @doc("The resource is being updated.")
  Updating,
  @doc("The resource is being deleted.")
  Deleting,
  @doc("The resource provisioning request has been accepted.")
  Accepted,
}

interface Operations extends Azure.ResourceManager.Operations {}

@armResourceOperations
interface Employees {
  get is ArmResourceRead<Employee>;
  createOrUpdate is ArmResourceCreateOrUpdateAsync<Employee>;
  update is ArmResourcePatchSync<Employee, EmployeeProperties>;
  delete is ArmResourceDeleteSync<Employee>;
  listByResourceGroup is ArmResourceListByParent<Employee>;
  listBySubscription is ArmListBySubscription<Employee>;
}
