import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using Azure.ClientGenerator.Core;

@service(#{ title: "ProtocolApiSyncOverAsync" })
namespace TspTest.ProtocolApiSyncOverAsync;

model RequestModel {
  name: string;
}

model ResponseModel {
  name: string;
}

@route("/items")
@post
@convenientAPI(true)
@protocolAPI(false)
op create(@body body: RequestModel): ResponseModel;
