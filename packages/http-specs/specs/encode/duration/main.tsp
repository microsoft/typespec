import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for encode decorator on duration.")
@scenarioService("/encode/duration")
namespace Encode.Duration;

@route("/query")
namespace Query {
  @route("/default")
  @scenario
  @scenarioDoc("""
    Test default encode for a duration parameter.
    Expected query parameter `input=P40D`
    """)
  op default(
    @query
    input: duration,
  ): NoContentResponse;

  @route("/iso8601")
  @scenario
  @scenarioDoc("""
    Test iso8601 encode for a duration parameter.
    Expected query parameter `input=P40D`
    """)
  op iso8601(
    @query
    @encode(DurationKnownEncoding.ISO8601)
    input: duration,
  ): NoContentResponse;

  @route("/int32-seconds")
  @scenario
  @scenarioDoc("""
    Test int32 seconds encode for a duration parameter.
    Expected query parameter `input=36`
    """)
  op int32Seconds(
    @query
    @encode(DurationKnownEncoding.seconds, int32)
    input: duration,
  ): NoContentResponse;

  @route("/float-seconds")
  @scenario
  @scenarioDoc("""
    Test float seconds encode for a duration parameter.
    Expected query parameter `input=35.625`
    """)
  op floatSeconds(
    @query
    @encode(DurationKnownEncoding.seconds, float)
    input: duration,
  ): NoContentResponse;

  @route("/float64-seconds")
  @scenario
  @scenarioDoc("""
    Test float64 seconds encode for a duration parameter.
    Expected query parameter `input=35.625`
    """)
  op float64Seconds(
    @query
    @encode(DurationKnownEncoding.seconds, float64)
    input: duration,
  ): NoContentResponse;

  @encode(DurationKnownEncoding.seconds, int32)
  scalar Int32Duration extends duration;

  @route("/int32-seconds-array")
  @scenario
  @scenarioDoc("""
    Test int32 seconds encode for a duration array parameter.
    Expected query parameter `input=36,47`
    """)
  op int32SecondsArray(
    #suppress "deprecated" "Deprecated in next release"
    @query({
      format: "csv",
    })
    input: Int32Duration[],
  ): NoContentResponse;
}

@route("/property")
namespace Property {
  model DefaultDurationProperty {
    value: duration;
  }

  model ISO8601DurationProperty {
    @encode(DurationKnownEncoding.ISO8601)
    value: duration;
  }

  model Int32SecondsDurationProperty {
    @encode(DurationKnownEncoding.seconds, int32)
    value: duration;
  }

  model FloatSecondsDurationProperty {
    @encode(DurationKnownEncoding.seconds, float)
    value: duration;
  }

  model Float64SecondsDurationProperty {
    @encode(DurationKnownEncoding.seconds, float64)
    value: duration;
  }

  @encode(DurationKnownEncoding.seconds, float32)
  scalar Float32Duration extends duration;

  model FloatSecondsDurationArrayProperty {
    value: Float32Duration[];
  }

  @route("/default")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a duration property with default encode.
    Expected request body:
    ```json
    {
      "value": "P40D"
    }
    ```
    Expected response body:
    ```json
    {
      "value": "P40D"
    }
    ```
    """)
  @post
  op default(@body body: DefaultDurationProperty): DefaultDurationProperty;

  @route("/iso8601")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a duration property with iso8601 encode.
    Expected request body:
    ```json
    {
      "value": "P40D"
    }
    ```
    Expected response body:
    ```json
    {
      "value": "P40D"
    }
    ```
    """)
  @post
  op iso8601(@body body: ISO8601DurationProperty): ISO8601DurationProperty;

  @route("/int32-seconds")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a duration property with int32 seconds encode.
    Expected request body:
    ```json
    {
      "value": 36
    }
    ```
    Expected response body:
    ```json
    {
      "value": 36
    }
    ```
    """)
  op int32Seconds(@body body: Int32SecondsDurationProperty): Int32SecondsDurationProperty;

  @route("/float-seconds")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a duration property with float seconds encode.
    Expected request body:
    ```json
    {
      "value": 35.625
    }
    ```
    Expected response body:
    ```json
    {
      "value": 35.625
    }
    ```
    """)
  op floatSeconds(@body body: FloatSecondsDurationProperty): FloatSecondsDurationProperty;

  @route("/float64-seconds")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a duration property with float64 seconds encode.
    Expected request body:
    ```json
    {
      "value": 35.625
    }
    ```
    Expected response body:
    ```json
    {
      "value": 35.625
    }
    ```
    """)
  op float64Seconds(@body body: Float64SecondsDurationProperty): Float64SecondsDurationProperty;

  @route("/float-seconds-array")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains an array property which elements are duration with float seconds encode.
    Expected request body:
    ```json
    {
      "value": [35.625, 46.75]
    }
    ```
    Expected response body:
    ```json
    {
      "value": [35.625, 46.75]
    }
    ```
    """)
  op floatSecondsArray(
    @body body: FloatSecondsDurationArrayProperty,
  ): FloatSecondsDurationArrayProperty;
}

@route("/header")
namespace Header {
  @route("/default")
  @scenario
  @scenarioDoc("""
    Test default encode for a duration header.
    Expected header `input=P40D`
    """)
  op default(
    @header
    duration: duration,
  ): NoContentResponse;

  @route("/iso8601")
  @scenario
  @scenarioDoc("""
    Test iso8601 encode for a duration header.
    Expected header `duration: P40D`
    """)
  op iso8601(
    @header
    @encode(DurationKnownEncoding.ISO8601)
    duration: duration,
  ): NoContentResponse;

  @encode(DurationKnownEncoding.ISO8601)
  scalar Iso8601Duration extends duration;

  @route("/iso8601-array")
  @scenario
  @scenarioDoc("""
    Test iso8601 encode for a duration array header.
    Expected header `duration: [P40D,P50D]`
    """)
  op iso8601Array(
    @header({
      format: "csv",
    })
    duration: Iso8601Duration[],
  ): NoContentResponse;

  @route("/int32-seconds")
  @scenario
  @scenarioDoc("""
    Test int32 seconds encode for a duration header.
    Expected header `duration: 36`
    """)
  op int32Seconds(
    @header
    @encode(DurationKnownEncoding.seconds, int32)
    duration: duration,
  ): NoContentResponse;

  @route("/float-seconds")
  @scenario
  @scenarioDoc("""
    Test float seconds encode for a duration header.
    Expected header `duration: 35.625`
    """)
  op floatSeconds(
    @header
    @encode(DurationKnownEncoding.seconds, float)
    duration: duration,
  ): NoContentResponse;

  @route("/float64-seconds")
  @scenario
  @scenarioDoc("""
    Test float64 seconds encode for a duration header.
    Expected header `duration: 35.625`
    """)
  op float64Seconds(
    @header
    @encode(DurationKnownEncoding.seconds, float64)
    duration: duration,
  ): NoContentResponse;
}
