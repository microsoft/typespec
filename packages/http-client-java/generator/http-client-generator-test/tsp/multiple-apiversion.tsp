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
  title: "MultipleApiVersion",
})
@versioned(Cadl.MultipleApiVersion.Versions)
@Azure.ClientGenerator.Core.client({
  name: "FirstClient",
})
namespace Cadl.MultipleApiVersion {
  @resource("resources")
  model Resource {
    @visibility("read")
    id: string;

    @key
    @visibility("read")
    name: string;

    type: string;
  }

  interface ResourceOperations
    extends Azure.Core.ResourceOperations<NoRepeatableRequests &
        NoConditionalRequests &
        NoClientRequestId> {}

  enum Versions {
    @useDependency(global.Azure.Core.Versions.v1_0_Preview_2)
    v2022_06_01_preview: "2022-06-01-preview",

    v2022_12_01_preview: "2022-12-01-preview",
  }

  @route("/client1")
  interface Client {
    get is ResourceOperations.ResourceRead<Resource>;
  }
}

@service({
  title: "MultipleApiVersion2",
})
@versioned(Cadl.MultipleApiVersion2.Versions)
@Azure.ClientGenerator.Core.client({
  name: "SecondClient",
})
namespace Cadl.MultipleApiVersion2 {
  @resource("resources")
  model Resource2 {
    @visibility("read")
    id: string;

    @key
    @visibility("read")
    name: string;

    type: string;
  }

  interface ResourceOperations
    extends Azure.Core.ResourceOperations<NoRepeatableRequests &
        NoConditionalRequests &
        NoClientRequestId> {}

  enum Versions {
    @useDependency(global.Azure.Core.Versions.v1_0_Preview_2)
    v2022_10_01_preview: "2022-10-01-preview",

    v2022_12_01_preview: "2022-12-01-preview",
  }

  @route("/client2")
  interface Client {
    get is ResourceOperations.ResourceRead<Resource2>;
  }
}

@service({
  title: "MultipleApiVersion3",
})
@versioned(Cadl.MultipleApiVersion3.Versions)
@Azure.ClientGenerator.Core.client({
  name: "NoApiVersionClient",
})
namespace Cadl.MultipleApiVersion3 {
  enum Versions {
    v2022_10_01_preview: "2022-10-01-preview",
    v2022_12_01_preview: "2022-12-01-preview",
  }

  @route("/client3")
  interface Client {
    // no api-version query parameter in the API
    @post
    action(@added(Versions.v2022_12_01_preview) @query param1?: string): OkResponse;
  }
}
