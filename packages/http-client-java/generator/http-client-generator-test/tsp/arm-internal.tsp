import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Versioning;
using Azure.ResourceManager;
using Azure.ClientGenerator.Core;

@armProviderNamespace
@service(#{ title: "ArmInternal" })
@versioned(Versions)
namespace TspTest.ArmInternal;

enum Versions {
  v2026_01_01: "2026-01-01",
  v2026_06_01: "2026-06-01",
}

model Widget is ProxyResource<WidgetProperties> {
  ...ResourceNameParameter<Widget>;
}

model WidgetProperties {
  @visibility(Lifecycle.Read)
  provisioningState?: ResourceProvisioningState;

  state?: SharedState;
}

#suppress "@azure-tools/typespec-client-generator-core/conflict-access-override" "Public API usage takes precedence over internal access."
@access(Access.internal, "java")
union SharedState {
  string,
  Ready: "Ready",
}

model InternalRequest {
  details: InternalDetails;
}

model InternalDetails {
  state?: InternalState;
  kind?: InternalKind;
}

union InternalState {
  string,
  Pending: "Pending",
}

enum InternalKind {
  First,
  Second,
}

model InternalBase {
  name?: string;
}

model InternalResult extends InternalBase {
  details?: InternalDetails;
}

#suppress "@azure-tools/typespec-client-generator-core/conflict-access-override" "Public API usage takes precedence over internal access."
@access(Access.internal, "java")
model SharedResult {
  value?: string;
}

@armResourceOperations
interface Widgets {
  @access(Access.internal, "python")
  get is ArmResourceRead<Widget>;

  @access(Access.internal, "java")
  inspect is ArmResourceActionSync<
    Widget,
    InternalRequest,
    InternalResult,
    Azure.ResourceManager.Foundations.BaseParameters<Widget> & {
      @added(Versions.v2026_06_01)
      @query
      detail?: string;
    }
  >;

  @access(Access.internal, "java")
  inspectShared is ArmResourceActionSync<Widget, void, SharedResult>;

  readShared is ArmResourceActionSync<Widget, void, SharedResult>;
}

model Secret is ProxyResource<SecretProperties> {
  ...ResourceNameParameter<Secret>;
}

model SecretProperties {
  @visibility(Lifecycle.Read)
  provisioningState?: ResourceProvisioningState;

  details?: InternalDetails;
}

@armResourceOperations
interface Secrets {
  @access(Access.internal, "java")
  get is ArmResourceRead<Secret>;

  @access(Access.internal, "java")
  createOrUpdate is ArmResourceCreateOrReplaceAsync<Secret>;

  @access(Access.internal, "java")
  update is ArmResourcePatchSync<Secret, SecretProperties>;

  @access(Access.internal, "java")
  listByResourceGroup is ArmResourceListByParent<Secret>;

  @access(Access.internal, "java")
  delete is ArmResourceDeleteSync<Secret>;
}
