import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for encode decorator on boolean.")
@scenarioService("/encode/boolean")
namespace Encode.Boolean;

@route("/property")
namespace Property {
  @route("/bool-as-string")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model containing a property of boolean type with string encode.
    Expected request body:
    ```json
    {
      "value": "true"
    }
    ```
    Expected response body:
    ```json
    {
      "value": "true"
    }
    ```
    """)
  @post
  op boolAsString(@body value: BoolAsStringProperty): BoolAsStringProperty;

  model BoolAsStringProperty {
    @encode(string)
    value: boolean;
  }
}
