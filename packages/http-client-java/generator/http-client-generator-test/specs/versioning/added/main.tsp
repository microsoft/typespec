import "@typespec/http";
import "@typespec/spector";
import "@typespec/versioning";

using Http;
using Spector;
using TypeSpec.Versioning;

/**
 * Test for the `@added` decorator.
 */
@service
@versioned(Versions)
@server(
  "{endpoint}/versioning/added/api-version:{version}",
  "Testserver endpoint",
  {
    /**
     * Need to be set as 'http://localhost:3000' in client.
     */
    endpoint: url,

    /**
     * Need to be set as 'v1' or 'v2' in client.
     */
    version: Versions,
  }
)
namespace Versioning.Added;

/**
 * The version of the API.
 */
enum Versions {
  /**
   * The version v1.
   */
  v1: "v1",

  /**
   * The version v2.
   */
  v2: "v2",
}

model ModelV1 {
  prop: string;
  enumProp: EnumV1;

  @added(Versions.v2)
  unionProp: UnionV1;
}

enum EnumV1 {
  enumMemberV1,

  @added(Versions.v2)
  enumMemberV2,
}

@added(Versions.v2)
model ModelV2 {
  prop: string;
  enumProp: EnumV2;
  unionProp: UnionV2;
}

@added(Versions.v2)
enum EnumV2 {
  enumMember,
}

union UnionV1 {
  string,

  @added(Versions.v2)
  V2Scalar,
}

@added(Versions.v2)
union UnionV2 {
  string,
  int32,
}

@added(Versions.v2)
scalar V2Scalar extends int32;

@scenario
@scenarioDoc("""
  This operation should be generated with latest version's signature.
  
  Expected request body:
  ```json
  { "prop": "foo", "enumProp": "enumMemberV2", "unionProp": 10 }
  ```
  
  Expected header:
  header-v2=bar
  
  """)
@route("/v1")
@post
op v1(@body body: ModelV1, @added(Versions.v2) @header headerV2: string): ModelV1;

@scenario
@scenarioDoc("""
  This operation should only be generated with latest version.
  
  Expected request body:
  ```json
  { "prop": "foo", "enumProp": "enumMember", "unionProp": "bar" }
  ```
  """)
@route("/v2")
@added(Versions.v2)
@post
op v2(@body body: ModelV2): ModelV2;

@added(Versions.v2)
@scenario
@scenarioDoc("""
  This operation group should only be generated with latest version.
  
  Expected request body for v2InInterface:
  ```json
  { "prop": "foo", "enumProp": "enumMember", "unionProp": "bar" }
  ```
  
  """)
@route("/interface-v2")
interface InterfaceV2 {
  @post
  @route("/v2")
  v2InInterface(@body body: ModelV2): ModelV2;
}
