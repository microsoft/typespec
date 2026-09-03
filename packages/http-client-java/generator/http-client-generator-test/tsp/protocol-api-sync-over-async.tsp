import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using Azure.Core;
using Azure.Core.Traits;
using Azure.ClientGenerator.Core;

@service(#{ title: "ProtocolApiSyncOverAsync" })
namespace TspTest.ProtocolApiSyncOverAsync;

model RequestModel {
  name: string;
}

model ResponseModel {
  name: string;
}

@resource("resources")
model ResourceModel {
  @visibility(Lifecycle.Read)
  id: string;

  @key
  name: string;
}

interface ResourceOperations
  extends Azure.Core.ResourceOperations<NoRepeatableRequests &
      NoConditionalRequests &
      NoClientRequestId> {}

@route("/items")
@post
@convenientAPI(true, "java")
@protocolAPI(false, "java")
op create(@body body: RequestModel): ResponseModel;

@protocolAPI(false, "java")
op list is ResourceOperations.ResourceList<ResourceModel>;
