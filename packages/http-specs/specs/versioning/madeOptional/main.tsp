import "@typespec/http";
import "@typespec/spector";
import "@typespec/versioning";

using Http;
using Spector;
using TypeSpec.Versioning;

/**
 * Test for the `@madeOptional` decorator.
 */
@service
@versioned(Versions)
@server(
  "{endpoint}/versioning/made-optional/api-version:{version}",
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
namespace Versioning.MadeOptional;

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

  @madeOptional(Versions.v2)
  changedProp?: string;
}

@scenario
@scenarioDoc("""
  This operation should be generated with latest version's signature.
  
  Expected request body:
  ```json
  { "prop": "foo" }
  ```
  
  """)
@route("/test")
@post
op test(@body body: TestModel, @madeOptional(Versions.v2) @query param?: string): TestModel;
