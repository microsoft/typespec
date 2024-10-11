import "@typespec/http";
import "@typespec/spector";
import "@typespec/versioning";

using Http;
using Spector;
using TypeSpec.Versioning;

/**
 * Test for the `@removed` decorator.
 */
@service
@versioned(Versions)
@server(
  "{endpoint}/versioning/removed/api-version:{version}",
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
namespace Versioning.Removed;

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

@removed(Versions.v2)
model ModelV1 {
  prop: string;
  enumProp: EnumV1;
  unionProp: UnionV1;
}

@removed(Versions.v2)
enum EnumV1 {
  enumMember,
}

model ModelV2 {
  prop: string;

  @removed(Versions.v2)
  removedProp: string;

  enumProp: EnumV2;

  @added(Versions.v1)
  unionProp: UnionV2;
}

enum EnumV2 {
  @removed(Versions.v2)
  enumMemberV1,

  enumMemberV2,
}

@removed(Versions.v2)
union UnionV1 {
  string,
  int32,
}

union UnionV2 {
  string,
  float32,

  @removed(Versions.v2)
  V1Scalar,
}

@removed(Versions.v2)
scalar V1Scalar extends int32;

/**
 * This operation should not be generated with latest version's signature.
 */
#suppress "@azure-tools/cadl-ranch-expect/missing-scenario" "by design"
@route("/v1")
@post
@removed(Versions.v2)
op v1(@body body: ModelV1): ModelV1;

@scenario
@scenarioDoc("""
  This operation should be generated with latest version's signature.
  
  Expected request body:
  ```json
  { "prop": "foo", "enumProp": "enumMemberV2", "unionProp": "bar" }
  ```
  """)
@route("/v2")
@post
op v2(@body body: ModelV2, @removed(Versions.v2) @query param: string): ModelV2;

/**
 * This operation group should not be generated with latest version.
 */
@route("/interface-v1")
@removed(Versions.v2)
interface InterfaceV1 {
  #suppress "@azure-tools/cadl-ranch-expect/missing-scenario" "by design"
  @post
  @route("/v1")
  v1InInterface(@body body: ModelV1): ModelV1;
}
