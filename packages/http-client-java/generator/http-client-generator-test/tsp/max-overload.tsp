import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service(#{ title: "MaxOverload" })
namespace TspTest.MaxOverload;

model CreateWidgetOptions {
  name: string;
}

model Widget {
  name: string;
}

@route("/max-overload")
interface MaxOverloadOperations {
  @post
  @convenientAPI(true)
  @protocolAPI(true)
  createWidget(@body body: CreateWidgetOptions): Widget;
}
