import "@typespec/rest";
import "@azure-tools/typespec-azure-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.Core.Traits;

@service({
  title: "SpecialHeaders",
})
@versioned(ApiVersions)
namespace TspTest.SpecialHeaders;

enum ApiVersions {
  @useDependency(global.Azure.Core.Versions.v1_0_Preview_2)
  v2022_06_01_preview: "2022-06-01-preview",
}

@resource("resources")
model Resource {
  @visibility("read")
  id: string;

  @key
  @visibility("read")
  name: string;

  description?: string;
  type: string;
}

interface StandardResourceOperations
  extends Azure.Core.ResourceOperations<NoRepeatableRequests &
      NoConditionalRequests &
      NoClientRequestId> {}

@route("/etag-headers")
interface EtagHeaders {
  @get
  listWithEtag is StandardResourceOperations.ResourceList<
    Resource,
    ResponseHeadersTrait<EtagResponseEnvelope>
  >;
}
