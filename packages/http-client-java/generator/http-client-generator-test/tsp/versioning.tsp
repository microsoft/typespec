import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.Core.Foundations;
using Azure.Core.Traits;

@service({
  title: "Versioning",
})
@versioned(ApiVersions)
namespace Cadl.Versioning;

enum ApiVersions {
  @useDependency(global.Azure.Core.Versions.v1_0_Preview_2)
  v2022_06_01_preview: "2022-06-01-preview",

  v2022_09_01: "2022-09-01",
  v2022_12_01_preview: "2022-12-01-preview",
}

@resource("resources")
model Resource {
  @visibility("read")
  id: string;

  @key
  @visibility("read")
  name: string;

  type: string;
}

model ExportedResource {
  id: string;

  @added(ApiVersions.v2022_09_01)
  resourceUri: string;

  @removed(ApiVersions.v2022_09_01)
  name: string;

  @removed(ApiVersions.v2022_09_01)
  @added(ApiVersions.v2022_12_01_preview)
  type: string;
}

model ExportParams {
  @query
  projectFileVersion?: string;

  @added(ApiVersions.v2022_12_01_preview)
  @query
  projectedFileFormat?: string;

  @removed(ApiVersions.v2022_09_01)
  @query
  removedQueryParam?: string;

  @removed(ApiVersions.v2022_09_01)
  @added(ApiVersions.v2022_12_01_preview)
  @query
  maxLines?: int32;
}

model ListQueryParams {
  ...SelectQueryParameter;

  @added(ApiVersions.v2022_12_01_preview)
  @query
  @doc("Filter the result list using the given expression.")
  filter?: string;

  @removed(ApiVersions.v2022_12_01_preview)
  @query
  expand?: string;
}

interface ResourceOperations
  extends Azure.Core.ResourceOperations<NoRepeatableRequests &
      NoConditionalRequests &
      NoClientRequestId> {}

@route("/versioning")
interface VersioningOp {
  @pollingOperation(ResourceOperations.GetResourceOperationStatus<Resource, ExportedResource>)
  export is ResourceOperations.LongRunningResourceAction<Resource, ExportParams, ExportedResource>;

  list is ResourceOperations.ResourceList<Resource, ListQueryParametersTrait<ListQueryParams>>;

  @added(ApiVersions.v2022_12_01_preview)
  @sharedRoute
  create is ResourceOperations.ResourceCreateOrReplace<Resource>;

  @added(ApiVersions.v2022_09_01)
  @removed(ApiVersions.v2022_12_01_preview)
  @sharedRoute
  createLongRunning is ResourceOperations.LongRunningResourceCreateOrReplace<Resource>;
}
