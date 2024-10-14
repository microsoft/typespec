import "@typespec/http";
import "@typespec/spector";
import "@typespec/versioning";

using Http;
using Spector;
using TypeSpec.Versioning;

/**
 * Test for the `@renamedFrom` decorator.
 */
@service
@versioned(Versions)
@server(
  "{endpoint}/versioning/renamed-from/api-version:{version}",
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
namespace Versioning.RenamedFrom;

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

@renamedFrom(Versions.v2, "OldModel")
model NewModel {
  @renamedFrom(Versions.v2, "oldProp")
  newProp: string;

  enumProp: NewEnum;
  unionProp: NewUnion;
}

@renamedFrom(Versions.v2, "OldEnum")
enum NewEnum {
  @renamedFrom(Versions.v2, "oldEnumMember")
  newEnumMember,
}

@renamedFrom(Versions.v2, "OldUnion")
union NewUnion {
  string,

  @renamedFrom(Versions.v2, "oldUnionVariant")
  newUnionVariant: NewScalar,
}

@renamedFrom(Versions.v2, "OldScalar")
scalar NewScalar extends int32;

@scenario
@scenarioDoc("""
  This operation should be generated with latest version's signature.
  
  Expected request body:
  ```json
  { "newProp": "foo", "enumProp": "newEnumMember", "unionProp": 10 }
  ```
  
  Expected query:
  newQuery=bar
  
  """)
@route("/test")
@post
@renamedFrom(Versions.v2, "oldOp")
op newOp(
  @body body: NewModel,

  @renamedFrom(Versions.v2, "oldQuery")
  @query
  newQuery: string,
): NewModel;

@renamedFrom(Versions.v2, "OldInterface")
@scenario
@scenarioDoc("""
  This operation group should only be generated with latest version's signature.
  
  Expected request body for test:
  ```json
  { "prop": "foo", "enumProp": "newEnumMember", "unionProp": 10 }
  ```
  
  """)
@route("/interface")
interface NewInterface {
  @post
  @route("/test")
  newOpInNewInterface(@body body: NewModel): NewModel;
}
