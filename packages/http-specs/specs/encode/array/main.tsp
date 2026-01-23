import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for encode decorator on array.")
@scenarioService("/encode/array")
namespace Encode.Array;

enum Colors {
  Blue: "blue",
  Red: "red",
  Green: "green",
}

union ColorsExtensibleEnum {
  string,
  Blue: "blue",
  Red: "red",
  Green: "green",
}

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

model CommaDelimitedEnumArrayProperty {
  @encode(ArrayEncoding.commaDelimited)
  value: Colors[];
}

model SpaceDelimitedEnumArrayProperty {
  @encode(ArrayEncoding.spaceDelimited)
  value: Colors[];
}

model PipeDelimitedEnumArrayProperty {
  @encode(ArrayEncoding.pipeDelimited)
  value: Colors[];
}

model NewlineDelimitedEnumArrayProperty {
  @encode(ArrayEncoding.newlineDelimited)
  value: Colors[];
}

model CommaDelimitedExtensibleEnumArrayProperty {
  @encode(ArrayEncoding.commaDelimited)
  value: ColorsExtensibleEnum[];
}

model SpaceDelimitedExtensibleEnumArrayProperty {
  @encode(ArrayEncoding.spaceDelimited)
  value: ColorsExtensibleEnum[];
}

model PipeDelimitedExtensibleEnumArrayProperty {
  @encode(ArrayEncoding.pipeDelimited)
  value: ColorsExtensibleEnum[];
}

model NewlineDelimitedExtensibleEnumArrayProperty {
  @encode(ArrayEncoding.newlineDelimited)
  value: ColorsExtensibleEnum[];
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

  @route("/enum/comma-delimited")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains an enum array property with commaDelimited encode.
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
  op enumCommaDelimited(
    @body body: CommaDelimitedEnumArrayProperty,
  ): CommaDelimitedEnumArrayProperty;

  @route("/enum/space-delimited")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains an enum array property with spaceDelimited encode.
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
  op enumSpaceDelimited(
    @body body: SpaceDelimitedEnumArrayProperty,
  ): SpaceDelimitedEnumArrayProperty;

  @route("/enum/pipe-delimited")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains an enum array property with pipeDelimited encode.
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
  op enumPipeDelimited(@body body: PipeDelimitedEnumArrayProperty): PipeDelimitedEnumArrayProperty;

  @route("/enum/newline-delimited")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains an enum array property with newlineDelimited encode.
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
  op enumNewlineDelimited(
    @body body: NewlineDelimitedEnumArrayProperty,
  ): NewlineDelimitedEnumArrayProperty;

  @route("/extensible-enum/comma-delimited")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains an extensible enum (union) array property with commaDelimited encode.
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
  op extensibleEnumCommaDelimited(
    @body body: CommaDelimitedExtensibleEnumArrayProperty,
  ): CommaDelimitedExtensibleEnumArrayProperty;

  @route("/extensible-enum/space-delimited")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains an extensible enum (union) array property with spaceDelimited encode.
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
  op extensibleEnumSpaceDelimited(
    @body body: SpaceDelimitedExtensibleEnumArrayProperty,
  ): SpaceDelimitedExtensibleEnumArrayProperty;

  @route("/extensible-enum/pipe-delimited")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains an extensible enum (union) array property with pipeDelimited encode.
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
  op extensibleEnumPipeDelimited(
    @body body: PipeDelimitedExtensibleEnumArrayProperty,
  ): PipeDelimitedExtensibleEnumArrayProperty;

  @route("/extensible-enum/newline-delimited")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains an extensible enum (union) array property with newlineDelimited encode.
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
  op extensibleEnumNewlineDelimited(
    @body body: NewlineDelimitedExtensibleEnumArrayProperty,
  ): NewlineDelimitedExtensibleEnumArrayProperty;
}
