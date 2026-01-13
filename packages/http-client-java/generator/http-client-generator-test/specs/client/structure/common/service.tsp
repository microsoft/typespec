import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";
import "@typespec/spector";

using Http;
using Rest;
using Azure.ClientGenerator;
using Azure.ClientGenerator.Core;

@doc("""
  Test that we can use @client and @operationGroup decorators to customize client side code structure, such as:
  1. have everything as default.
  2. to rename client or operation group
  3. one client can have more than one operations groups
  4. split one interface into two clients
  5. have two clients with operations come from different interfaces
  6. have two clients with a hierarchy relation.
  """)
@server(
  "{endpoint}/client/structure/{client}",
  "",
  {
    @doc("Need to be set as 'http://localhost:3000' in client.")
    endpoint: url,

    @doc("Need to be set as 'default', 'multi-client', 'renamed-operation', 'two-operation-group' in client.")
    client: ClientType,
  }
)
@service(#{ title: "MultiClient" })
namespace Client.Structure.Service;

enum ClientType {
  Default: "default",
  MultiClient: "multi-client",
  RenamedOperation: "renamed-operation",
  TwoOperationGroup: "two-operation-group",
  ClientOperationGroup: "client-operation-group",
}

#suppress "@typespec/spector/missing-scenario" "This is by design those operations get defined as scenarios in the client"
@route("/one")
@post
op one(): void;

#suppress "@typespec/spector/missing-scenario" "This is by design those operations get defined as scenarios in the client"
@route("/two")
@post
op two(): void;

interface Foo {
  #suppress "@typespec/spector/missing-scenario" "This is by design those operations get defined as scenarios in the client"
  @route("/three")
  @post
  three(): void;

  #suppress "@typespec/spector/missing-scenario" "This is by design those operations get defined as scenarios in the client"
  @route("/four")
  @post
  four(): void;
}

interface Bar {
  #suppress "@typespec/spector/missing-scenario" "This is by design those operations get defined as scenarios in the client"
  @route("/five")
  @post
  five(): void;
  #suppress "@typespec/spector/missing-scenario" "This is by design those operations get defined as scenarios in the client"
  @route("/six")
  @post
  six(): void;
}

namespace Baz {
  interface Foo {
    #suppress "@typespec/spector/missing-scenario" "This is by design those operations get defined as scenarios in the client"
    @route("/seven")
    @post
    seven(): void;
  }
}

namespace Qux {
  #suppress "@typespec/spector/missing-scenario" "This is by design those operations get defined as scenarios in the client"
  @route("/eight")
  @post
  op eight(): void;

  interface Bar {
    #suppress "@typespec/spector/missing-scenario" "This is by design those operations get defined as scenarios in the client"
    @route("/nine")
    @post
    nine(): void;
  }
}
