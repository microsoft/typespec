import "./main.tsp";
import "@azure-tools/typespec-client-generator-core";
import "@typespec/spector";

using Azure.ClientGenerator.Core;
using Spector;

@scenarioDoc("""
  This is to show we can have multiple clients, with multiple operation groups in each client.
  
  ```ts
  const client1 = new FirstClient("client-operation-group");
  
  client1.one();
  
  client1.group3.two();
  client1.group3.three();
  
  client1.group4.four();
  ```
  """)
@scenario
@client({
  name: "FirstClient",
  service: Client.Structure.Service,
})
namespace Client.Structure.ClientOperationGroup {
  op one is Client.Structure.Service.one;

  @operationGroup
  interface Group3 {
    two is Client.Structure.Service.two;
    three is Client.Structure.Service.Foo.three;
  }

  @operationGroup
  interface Group4 {
    four is Client.Structure.Service.Foo.four;
  }
}

@scenarioDoc("""
  This is to show we can have multiple clients, with multiple operation groups in each client.
  The client and its operation groups can be moved to a sub namespace/package.
  
  ```ts
  const client2 = new SubNamespace.SecondClient("client-operation-group");
  
  client2.five();
  client2.group5.six();
  ```
  """)
@scenario
@client(
  {
    name: "SubNamespace.SecondClient",
    service: Client.Structure.Service,
  },
  "csharp,java,python"
)
@client(
  {
    name: "SecondClient",
    service: Client.Structure.Service,
  },
  "javascript,go"
)
namespace Client.Structure.AnotherClientOperationGroup {
  op five is Client.Structure.Service.Bar.five;

  #suppress "@azure-tools/typespec-client-generator-core/client-service" "issue https://github.com/Azure/typespec-azure/issues/1326"
  @operationGroup
  interface Group5 {
    six is Client.Structure.Service.Bar.six;
  }
}
