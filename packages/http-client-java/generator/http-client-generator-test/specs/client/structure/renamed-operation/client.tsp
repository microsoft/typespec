import "./main.tsp";
import "@azure-tools/typespec-client-generator-core";
import "@typespec/spector";

using Azure.ClientGenerator.Core;
using Spector;

@scenarioDoc("""
  This is to show we can have more than one operation group in a client. The client side should be able to call the api like
  ```ts
  const client = new RenamedOperationClient("renamed-operation");
  
  client.renamedOne();
  client.renamedThree();
  client.renamedFive();
  
  client.group.renamedTwo();
  client.group.renamedFour();
  client.group.renamedSix();
  ```
  """)
@client({
  name: "RenamedOperationClient",
  service: Client.Structure.Service,
})
@scenario
namespace Client.Structure.RenamedOperation;

// Those operations are renamed at the root
op renamedOne is Client.Structure.Service.one;
op renamedThree is Client.Structure.Service.Foo.three;
op renamedFive is Client.Structure.Service.Bar.five;

// Those operations are renamed inside an operation group
@operationGroup
interface Group {
  renamedTwo is Client.Structure.Service.two;
  renamedFour is Client.Structure.Service.Foo.four;
  renamedSix is Client.Structure.Service.Bar.six;
}
