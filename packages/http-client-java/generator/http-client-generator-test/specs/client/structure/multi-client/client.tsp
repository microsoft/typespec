import "./main.tsp";
import "@azure-tools/typespec-client-generator-core";
import "@typespec/spector";

using Azure.ClientGenerator.Core;
using Spector;

@scenarioDoc("""
  Include multiple clients in the same spec.
  ```ts
  const clientA = new ClientAClient("multi-client");
  const clientB = new ClientBClient("multi-client");
  
  clientA.renamedOne();
  clientA.renamedThree();
  clientA.renamedFive();
  
  clientB.renamedTwo();
  clientB.renamedFour();
  clientB.renamedSix();
  ```
  """)
@scenario
namespace Client.Structure.MultiClient;

@client({
  name: "ClientAClient",
  service: Client.Structure.Service,
})
interface ClientA {
  renamedOne is Client.Structure.Service.one;
  renamedThree is Client.Structure.Service.Foo.three;
  renamedFive is Client.Structure.Service.Bar.five;
}

@client({
  name: "ClientBClient",
  service: Client.Structure.Service,
})
interface ClientB {
  renamedTwo is Client.Structure.Service.two;
  renamedFour is Client.Structure.Service.Foo.four;
  renamedSix is Client.Structure.Service.Bar.six;
}
