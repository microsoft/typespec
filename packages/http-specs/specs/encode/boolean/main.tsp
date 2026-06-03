import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for encode decorator on boolean.")
@scenarioService("/encode/boolean")
namespace Encode.Boolean;

@route("/property")
namespace Property {
  model BoolAsStringProperty {
    @encode(string)
    value: boolean;
  }

  alias SendBoolTrueLower = SendBoolAsString<"true">;

  @route("/true-lower")
  op trueLower is SendBoolTrueLower.sendBoolAsString;

  alias SendBoolFalseLower = SendBoolAsString<"false">;

  @route("/false-lower")
  op falseLower is SendBoolFalseLower.sendBoolAsString;

  alias SendBoolTrueUpper = SendBoolAsString<"TRUE">;

  @route("/true-upper")
  op trueUpper is SendBoolTrueUpper.sendBoolAsString;

  alias SendBoolFalseMixed = SendBoolAsString<"FaLsE">;

  @route("/false-mixed")
  op falseMixed is SendBoolFalseMixed.sendBoolAsString;

  interface SendBoolAsString<StringValue extends string> {
    @scenario
    @scenarioDoc(
      """
        Test operation with request and response model containing a property of boolean type with string encode.
        Expected request body:
        ```json
        {
          "value": "{value}"
        }
        ```
        Expected response body:
        ```json
        {
          "value": "{value}"
        }
        ```
        """,
      { value: StringValue }
    )
    @post
    sendBoolAsString(@body value: BoolAsStringProperty): BoolAsStringProperty;
  }
}
