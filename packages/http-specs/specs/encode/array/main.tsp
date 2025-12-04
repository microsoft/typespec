import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for encode decorator on array.")
@scenarioService("/encode/array")
namespace Encode.Array;

model CommaDelimitedArrayProperty {
  @encode(ArrayEncoding.commaDelimited)
  value: string[];
}

model SpaceDelimitedArrayProperty {
  @encode(ArrayEncoding.spaceDelimited)
  value: string[];
}

model PipeDelimitedArrayProperty {
  @encode(ArrayEncoding.pipeDelimited)
  value: string[];
}

model NewlineDelimitedArrayProperty {
  @encode(ArrayEncoding.newlineDelimited)
  value: string[];
}

@route("/property")
namespace Property {
  @route("/comma-delimited")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a string array property with commaDelimited encode.
    Expected request body:
    ```json
    {
      "value": "blue,red,green"
    }
    ```
    Expected response body:
    ```json
    {
      "value": "blue,red,green"
    }
    ```
    """)
  @post
  op commaDelimited(@body body: CommaDelimitedArrayProperty): CommaDelimitedArrayProperty;

  @route("/space-delimited")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a string array property with spaceDelimited encode.
    Expected request body:
    ```json
    {
      "value": "blue red green"
    }
    ```
    Expected response body:
    ```json
    {
      "value": "blue red green"
    }
    ```
    """)
  @post
  op spaceDelimited(@body body: SpaceDelimitedArrayProperty): SpaceDelimitedArrayProperty;

  @route("/pipe-delimited")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a string array property with pipeDelimited encode.
    Expected request body:
    ```json
    {
      "value": "blue|red|green"
    }
    ```
    Expected response body:
    ```json
    {
      "value": "blue|red|green"
    }
    ```
    """)
  @post
  op pipeDelimited(@body body: PipeDelimitedArrayProperty): PipeDelimitedArrayProperty;

  @route("/newline-delimited")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a string array property with newlineDelimited encode.
    Expected request body:
    ```json
    {
      "value": "blue\\nred\\ngreen"
    }
    ```
    Expected response body:
    ```json
    {
      "value": "blue\\nred\\ngreen"
    }
    ```
    """)
  @post
  op newlineDelimited(@body body: NewlineDelimitedArrayProperty): NewlineDelimitedArrayProperty;
}
