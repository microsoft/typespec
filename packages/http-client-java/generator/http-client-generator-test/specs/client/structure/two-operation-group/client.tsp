import "./main.tsp";
import "@azure-tools/typespec-client-generator-core";
import "@typespec/spector";

using Azure.ClientGenerator.Core;
using Spector;

@scenarioDoc("""
  This is to show we can have more than one operation group in a client. The client side should be able to call the api like
  
  ```ts
  const client = new TwoOperationGroupClient("two-operation-group");
  
  client.group1.one();
  client.group1.three();
  client.group1.four();
  
  client.group2.two();
  client.group2.five();
  client.group2.six();
  ```
  """)
@client({
  name: "TwoOperationGroupClient",
  service: Client.Structure.Service,
})
@scenario
namespace Client.Structure.TwoOperationGroup;

@operationGroup
interface Group1 {
  one is Client.Structure.Service.one;
  three is Client.Structure.Service.Foo.three;
  four is Client.Structure.Service.Foo.four;
}

@operationGroup
interface Group2 {
  two is Client.Structure.Service.two;
  five is Client.Structure.Service.Bar.five;
  six is Client.Structure.Service.Bar.six;
}
