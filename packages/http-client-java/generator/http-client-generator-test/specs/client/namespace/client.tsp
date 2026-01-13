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
@clientNamespace("client.clientnamespace")
interface ClientNamespaceFirstClient {
  getFirst is First.getFirst;
}
@@clientNamespace(FirstModel, "client.clientnamespace.first");

@client({
  name: "ClientNamespaceSecondClient",
  service: Client.ClientNamespace,
})
@clientNamespace("client.clientnamespace.second")
namespace ClientNamespaceSecondClient {
  op getSecond is Second.getSecond;
}
@@clientNamespace(Second.Model, "client.clientnamespace.second");
@@clientNamespace(Second.Model.SecondClientEnumType, "client.clientnamespace.second.sub");
