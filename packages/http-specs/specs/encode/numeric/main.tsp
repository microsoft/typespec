import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for encode decorator on integer.")
@scenarioService("/encode/numeric")
namespace Encode.Numeric;

@route("/property")
namespace Property {
  alias SendSafeIntAsString = SendIntAsString<safeint, "10000000000", SafeintAsStringProperty>;

  @route("/safeint")
  op safeintAsString is SendSafeIntAsString.sendIntAsString;

  model SafeintAsStringProperty {
    @encode(string)
    value: safeint;
  }

  alias SendUint32AsString = SendIntAsString<uint32, "1", Uint32AsStringProperty>;

  @route("/uint32")
  op uint32AsStringOptional is SendUint32AsString.sendIntAsString;

  model Uint32AsStringProperty {
    @encode(string)
    value?: uint32;
  }

  alias SendUint8AsString = SendIntAsString<uint8, "255", Uint8AsStringProperty>;

  @route("/uint8")
  op uint8AsString is SendUint8AsString.sendIntAsString;

  model Uint8AsStringProperty {
    @encode(string)
    value: uint8;
  }

  interface SendIntAsString<IntType extends integer, StringValue extends string, Payload> {
    @scenario
    @scenarioDoc(
      """
        Test operation with request and response model contains property of {type} type with string encode.
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
      {
        type: IntType,
        value: StringValue,
      }
    )
    @post
    sendIntAsString(@body value: Payload): Payload;
  }
}
