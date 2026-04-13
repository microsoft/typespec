import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service(#{ title: "ClientOption" })
namespace TspTest.ClientOption;

alias ClientRequiredParameters = {
  @header accept?: "application/json;odata.metadata=minimal";
  @query filter: string;
};

model ClientRequiredRequest {
  name: string;
  timespan?: duration;
}

@route("/client-required")
interface ClientRequired {
  @post
  post(...ClientRequiredParameters, @body body: ClientRequiredRequest): {};
}

@@clientOption(ClientRequiredParameters.accept, "clientRequired", true, "java");
@@clientOption(ClientRequiredParameters.filter, "clientRequired", false, "java");
@@clientOption(ClientRequiredRequest.timespan, "clientRequired", true, "java");
