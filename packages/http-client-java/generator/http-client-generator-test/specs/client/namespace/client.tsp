import "./main.tsp";
import "@azure-tools/typespec-client-generator-core";

using Http;
using Spector;
using Azure.ClientGenerator.Core;
using Client.ClientNamespace;

@route("/client/client-namespace")
namespace ClientNameSpaceClient;

@client({
  name: "ClientNamespaceFirstClient",
  service: Client.ClientNamespace,
})
@clientNamespace("client.clientnamespace", "java")
@clientNamespace("client.clientnamespace", "python")
@clientNamespace("client.clientnamespace", "javascript")
interface ClientNamespaceFirstClient {
  getFirst is First.getFirst;
}
@@clientNamespace(FirstModel, "client.clientnamespace.first", "java");
@@clientNamespace(FirstModel, "client.clientnamespace.first", "python");
@@clientNamespace(FirstModel, "client.clientnamespace.first", "javascript");

@client({
  name: "ClientNamespaceSecondClient",
  service: Client.ClientNamespace,
})
@clientNamespace("client.clientnamespace.second", "java")
@clientNamespace("client.clientnamespace.second", "python")
@clientNamespace("client.clientnamespace.second", "javascript")
namespace ClientNamespaceSecondClient {
  op getSecond is Second.getSecond;
}
@@clientNamespace(Second.Model, "client.clientnamespace.second", "java");
@@clientNamespace(Second.Model, "client.clientnamespace.second", "python");
@@clientNamespace(Second.Model, "client.clientnamespace.second", "javascript");
@@clientNamespace(Second.Model.SecondClientEnumType, "client.clientnamespace.second.sub", "java");
@@clientNamespace(Second.Model.SecondClientEnumType, "client.clientnamespace.second.sub", "python");
@@clientNamespace(Second.Model.SecondClientEnumType,
  "client.clientnamespace.second.sub",
  "javascript"
);
