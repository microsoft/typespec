import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Ordinary unions with scalar constraints. Constraints do not add wire discriminators.")
@scenarioService("/type/union/extends")
namespace Type.Union.Extends;

@route("/derived-scalar")
namespace DerivedScalar {
  scalar CollectionId extends string;

  @doc("Preserve both literal and custom string values without requiring an enum SDK representation.")
  union CollectionSelector extends string {
    all: "all",
    collection: CollectionId,
  }

  @doc("The literal alternative remains the JSON string \"all\".")
  @route("/literal")
  interface Literal extends ValueOperations<CollectionSelector, "\"all\""> {}

  @doc("A derived-scalar alternative remains an arbitrary JSON string, not a closed enum value.")
  @route("/custom")
  interface Custom extends ValueOperations<CollectionSelector, "\"collection-123\""> {}
}

interface ValueOperations<T, Payload extends valueof string> {
  @scenario
  @scenarioDoc("""
    Receive an ordinary constrained union as JSON, without a discriminator or envelope.
    Expected response body:
    ```json
    ${Payload}
    ```
    """)
  @get
  get(): {
    @header contentType: "application/json";
    @body body: T;
  };

  @scenario
  @scenarioDoc("""
    Send an ordinary constrained union as JSON, without a discriminator or envelope.
    Expected request body:
    ```json
    ${Payload}
    ```
    The response has status 204 and no body.
    """)
  @put
  put(@header contentType: "application/json", @body body: T): NoContentResponse;
}
