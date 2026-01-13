import "@typespec/http";
import "@typespec/spector";
import "@typespec/versioning";

using Http;
using Spector;
using TypeSpec.Versioning;

/**
 * Test for the `@typeChangedFrom` decorator.
 */
@service
@versioned(Versions)
@server(
  "{endpoint}/versioning/type-changed-from/api-version:{version}",
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
namespace Versioning.TypeChangedFrom;

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

model TestModel {
  prop: string;

  @typeChangedFrom(Versions.v2, int32)
  changedProp: string;
}

@scenario
@scenarioDoc("""
  This operation should be generated with latest version's signature.
  
  Expected request body:
  ```json
  { "prop": "foo", "changedProp": "bar" }
  ```
  
  Expected query param:
  param="baz"
  
  """)
@route("/test")
@post
op test(
  @body body: TestModel,
  @typeChangedFrom(Versions.v2, int32) @query param: string,
): TestModel;
