import "@typespec/http";
import "@typespec/spector";
import "@typespec/versioning";

using Http;
using Spector;
using TypeSpec.Versioning;

/**
 * Test for the `@returnTypeChangedFrom` decorator.
 */
@service
@versioned(Versions)
@server(
  "{endpoint}/versioning/return-type-changed-from/api-version:{version}",
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
namespace Versioning.ReturnTypeChangedFrom;

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

@scenario
@scenarioDoc("""
  This operation should be generated with latest version's signature.
  
  Expected request body: "test"
  Expected response body: "test"
  
  """)
@route("/test")
@post
@returnTypeChangedFrom(Versions.v2, int32)
op test(@body body: string): string;
