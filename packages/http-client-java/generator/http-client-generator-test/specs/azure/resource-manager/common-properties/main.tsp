import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "./managed-identity.tsp";
import "./error.tsp";

using Http;
using Rest;
using Versioning;
using Azure.Core;
using Azure.ResourceManager;

@armProviderNamespace
@service
@versioned(Versions)
@doc("Arm Managed Identity Provider management API.")
namespace Azure.ResourceManager.CommonProperties;

@doc("Azure API versions.")
enum Versions {
  @doc("Preview API version 2023-12-01-preview.")
  v2023_12_01_preview: "2023-12-01-preview",
}
