import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Projection")
@scenarioService("/serialization/encoded-name/json")
namespace Serialization.EncodedName.Json;

@route("/property")
namespace Property {
  model JsonEncodedNameModel {
    /** Pass in true */
    @encodedName("application/json", "wireName")
    defaultName: boolean;
  }

  @scenario
  @scenarioDoc("""
    Testing that you send the right JSON name on the wire.
    Your generated SDK should generate JsonEncodedNameModel with one property `defaultName` with wire name `wireName`.
    
    Expected request body:
    ```json
    {"wireName": true}
    ```
    """)
  @post
  op send(@bodyRoot body: JsonEncodedNameModel): NoContentResponse;

  @scenario
  @scenarioDoc("""
    Testing that you deserialize the right json name over the wire.
    
    Your generated SDK should generate JsonEncodedNameModel with one property `defaultName` with wire name `wireName`.
    
    Expected response body:
    ```json
    {"wireName": true}
    ```
    """)
  @get
  op get(): JsonEncodedNameModel;
}
