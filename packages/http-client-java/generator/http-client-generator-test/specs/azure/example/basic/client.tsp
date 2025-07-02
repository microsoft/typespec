import "@azure-tools/typespec-client-generator-core";
import "@typespec/spector";
import "./main.tsp";

using Http;
using Azure.ClientGenerator.Core;
using Spector;

@TypeSpec.Versioning.useDependency(_Specs_.Azure.Example.Basic.Versions.v2022_12_01_preview)
@route("/azure/example/basic")
namespace AzureExampleBasicClient;

@@clientNamespace(AzureExampleBasicClient, "azure.example.basic", "java");
@@clientNamespace(_Specs_.Azure.Example.Basic, "azure.example.basic", "java");

@client({
  name: "AzureExampleClient",
  service: _Specs_.Azure.Example.Basic,
})
interface AzureExampleClient {
  basicAction is _Specs_.Azure.Example.Basic.ServiceOperationGroup.basic;
}
