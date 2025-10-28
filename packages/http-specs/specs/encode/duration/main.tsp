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

  @route("/int32-seconds-larger-unit")
  @scenario
  @scenarioDoc("""
    Test int32 seconds encode for a duration parameter where the duration is several minutes.
    Languages that support duration primitives should use the largest possible unit, e.g. TimeSpan.FromMinutes(2) in C#.
    Expected query parameter `input=120`
    """)
  op int32SecondsLargerUnit(
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

  @route("/float-seconds-larger-unit")
  @scenario
  @scenarioDoc("""
    Test float seconds encode for a duration parameter where the duration is several minutes.
    Languages that support duration primitives should use the largest possible unit, e.g. TimeSpan.FromMinutes(2.5) in C#.
    Expected query parameter `input=150.0`
    """)
  op floatSecondsLargerUnit(
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

  @route("/int32-milliseconds")
  @scenario
  @scenarioDoc("""
    Test int32 milliseconds encode for a duration parameter.
    Expected query parameter `input=36000`
    """)
  op int32Milliseconds(
    @query
    @encode(DurationKnownEncoding.milliseconds, int32)
    input: duration,
  ): NoContentResponse;

  @route("/int32-milliseconds-larger-unit")
  @scenario
  @scenarioDoc("""
    Test int32 milliseconds encode for a duration parameter where the duration is several minutes.
    Languages that support duration primitives should use the largest possible unit, e.g. TimeSpan.FromMinutes(3) in C#.
    Expected query parameter `input=180000`
    """)
  op int32MillisecondsLargerUnit(
    @query
    @encode(DurationKnownEncoding.milliseconds, int32)
    input: duration,
  ): NoContentResponse;

  @route("/float-milliseconds")
  @scenario
  @scenarioDoc("""
    Test float milliseconds encode for a duration parameter.
    Expected query parameter `input=35625`
    """)
  op floatMilliseconds(
    @query
    @encode(DurationKnownEncoding.milliseconds, float)
    input: duration,
  ): NoContentResponse;

  @route("/float-milliseconds-larger-unit")
  @scenario
  @scenarioDoc("""
    Test float milliseconds encode for a duration parameter where the duration is several minutes.
    Languages that support duration primitives should use the largest possible unit, e.g. TimeSpan.FromMinutes(3.5) in C#.
    Expected query parameter `input=210000.0`
    """)
  op floatMillisecondsLargerUnit(
    @query
    @encode(DurationKnownEncoding.milliseconds, float)
    input: duration,
  ): NoContentResponse;

  @route("/float64-milliseconds")
  @scenario
  @scenarioDoc("""
    Test float64 milliseconds encode for a duration parameter.
    Expected query parameter `input=35625`
    """)
  op float64Milliseconds(
    @query
    @encode(DurationKnownEncoding.milliseconds, float64)
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
    @query
    input: Int32Duration[],
  ): NoContentResponse;

  @encode(DurationKnownEncoding.milliseconds, int32)
  scalar Int32MillisecondsDuration extends duration;

  @route("/int32-milliseconds-array")
  @scenario
  @scenarioDoc("""
    Test int32 milliseconds encode for a duration array parameter.
    Expected query parameter `input=36000,47000`
    """)
  op int32MillisecondsArray(
    @query
    input: Int32MillisecondsDuration[],
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

  model Int32MillisecondsDurationProperty {
    @encode(DurationKnownEncoding.milliseconds, int32)
    value: duration;
  }

  model FloatMillisecondsDurationProperty {
    @encode(DurationKnownEncoding.milliseconds, float)
    value: duration;
  }

  model Float64MillisecondsDurationProperty {
    @encode(DurationKnownEncoding.milliseconds, float64)
    value: duration;
  }

  model Int32SecondsLargerUnitDurationProperty {
    @encode(DurationKnownEncoding.seconds, int32)
    value: duration;
  }

  model FloatSecondsLargerUnitDurationProperty {
    @encode(DurationKnownEncoding.seconds, float)
    value: duration;
  }

  model Int32MillisecondsLargerUnitDurationProperty {
    @encode(DurationKnownEncoding.milliseconds, int32)
    value: duration;
  }

  model FloatMillisecondsLargerUnitDurationProperty {
    @encode(DurationKnownEncoding.milliseconds, float)
    value: duration;
  }

  @encode(DurationKnownEncoding.seconds, float32)
  scalar Float32Duration extends duration;

  model FloatSecondsDurationArrayProperty {
    value: Float32Duration[];
  }

  @encode(DurationKnownEncoding.milliseconds, float32)
  scalar Float32MillisecondsDuration extends duration;

  model FloatMillisecondsDurationArrayProperty {
    value: Float32MillisecondsDuration[];
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

  @route("/int32-milliseconds")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a duration property with int32 milliseconds encode.
    Expected request body:
    ```json
    {
      "value": 36000
    }
    ```
    Expected response body:
    ```json
    {
      "value": 36000
    }
    ```
    """)
  op int32Milliseconds(
    @body body: Int32MillisecondsDurationProperty,
  ): Int32MillisecondsDurationProperty;

  @route("/float-milliseconds")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a duration property with float milliseconds encode.
    Expected request body:
    ```json
    {
      "value": 35625
    }
    ```
    Expected response body:
    ```json
    {
      "value": 35625
    }
    ```
    """)
  op floatMilliseconds(
    @body body: FloatMillisecondsDurationProperty,
  ): FloatMillisecondsDurationProperty;

  @route("/float64-milliseconds")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a duration property with float64 milliseconds encode.
    Expected request body:
    ```json
    {
      "value": 35625
    }
    ```
    Expected response body:
    ```json
    {
      "value": 35625
    }
    ```
    """)
  op float64Milliseconds(
    @body body: Float64MillisecondsDurationProperty,
  ): Float64MillisecondsDurationProperty;

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

  @route("/float-milliseconds-array")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains an array property which elements are duration with float milliseconds encode.
    Expected request body:
    ```json
    {
      "value": [35625, 46750]
    }
    ```
    Expected response body:
    ```json
    {
      "value": [35625, 46750]
    }
    ```
    """)
  op floatMillisecondsArray(
    @body body: FloatMillisecondsDurationArrayProperty,
  ): FloatMillisecondsDurationArrayProperty;

  @route("/int32-seconds-larger-unit")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a duration property with int32 seconds encode where the duration is several minutes.
    Languages that support duration primitives should use the largest possible unit, e.g. TimeSpan.FromMinutes(2) in C#.
    Expected request body:
    ```json
    {
      "value": 120
    }
    ```
    Expected response body:
    ```json
    {
      "value": 120
    }
    ```
    """)
  op int32SecondsLargerUnit(
    @body body: Int32SecondsLargerUnitDurationProperty,
  ): Int32SecondsLargerUnitDurationProperty;

  @route("/float-seconds-larger-unit")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a duration property with float seconds encode where the duration is several minutes.
    Languages that support duration primitives should use the largest possible unit, e.g. TimeSpan.FromMinutes(2.5) in C#.
    Expected request body:
    ```json
    {
      "value": 150.0
    }
    ```
    Expected response body:
    ```json
    {
      "value": 150.0
    }
    ```
    """)
  op floatSecondsLargerUnit(
    @body body: FloatSecondsLargerUnitDurationProperty,
  ): FloatSecondsLargerUnitDurationProperty;

  @route("/int32-milliseconds-larger-unit")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a duration property with int32 milliseconds encode where the duration is several minutes.
    Languages that support duration primitives should use the largest possible unit, e.g. TimeSpan.FromMinutes(3) in C#.
    Expected request body:
    ```json
    {
      "value": 180000
    }
    ```
    Expected response body:
    ```json
    {
      "value": 180000
    }
    ```
    """)
  op int32MillisecondsLargerUnit(
    @body body: Int32MillisecondsLargerUnitDurationProperty,
  ): Int32MillisecondsLargerUnitDurationProperty;

  @route("/float-milliseconds-larger-unit")
  @scenario
  @scenarioDoc("""
    Test operation with request and response model contains a duration property with float milliseconds encode where the duration is several minutes.
    Languages that support duration primitives should use the largest possible unit, e.g. TimeSpan.FromMinutes(3.5) in C#.
    Expected request body:
    ```json
    {
      "value": 210000.0
    }
    ```
    Expected response body:
    ```json
    {
      "value": 210000.0
    }
    ```
    """)
  op floatMillisecondsLargerUnit(
    @body body: FloatMillisecondsLargerUnitDurationProperty,
  ): FloatMillisecondsLargerUnitDurationProperty;
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
    @header
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

  @route("/int32-seconds-larger-unit")
  @scenario
  @scenarioDoc("""
    Test int32 seconds encode for a duration header where the duration is several minutes.
    Languages that support duration primitives should use the largest possible unit, e.g. TimeSpan.FromMinutes(2) in C#.
    Expected header `duration: 120`
    """)
  op int32SecondsLargerUnit(
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

  @route("/float-seconds-larger-unit")
  @scenario
  @scenarioDoc("""
    Test float seconds encode for a duration header where the duration is several minutes.
    Languages that support duration primitives should use the largest possible unit, e.g. TimeSpan.FromMinutes(2.5) in C#.
    Expected header `duration: 150.0`
    """)
  op floatSecondsLargerUnit(
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

  @route("/int32-milliseconds")
  @scenario
  @scenarioDoc("""
    Test int32 milliseconds encode for a duration header.
    Expected header `duration: 36000`
    """)
  op int32Milliseconds(
    @header
    @encode(DurationKnownEncoding.milliseconds, int32)
    duration: duration,
  ): NoContentResponse;

  @route("/int32-milliseconds-larger-unit")
  @scenario
  @scenarioDoc("""
    Test int32 milliseconds encode for a duration header where the duration is several minutes.
    Languages that support duration primitives should use the largest possible unit, e.g. TimeSpan.FromMinutes(3) in C#.
    Expected header `duration: 180000`
    """)
  op int32MillisecondsLargerUnit(
    @header
    @encode(DurationKnownEncoding.milliseconds, int32)
    duration: duration,
  ): NoContentResponse;

  @route("/float-milliseconds")
  @scenario
  @scenarioDoc("""
    Test float milliseconds encode for a duration header.
    Expected header `duration: 35625`
    """)
  op floatMilliseconds(
    @header
    @encode(DurationKnownEncoding.milliseconds, float)
    duration: duration,
  ): NoContentResponse;

  @route("/float-milliseconds-larger-unit")
  @scenario
  @scenarioDoc("""
    Test float milliseconds encode for a duration header where the duration is several minutes.
    Languages that support duration primitives should use the largest possible unit, e.g. TimeSpan.FromMinutes(3.5) in C#.
    Expected header `duration: 210000.0`
    """)
  op floatMillisecondsLargerUnit(
    @header
    @encode(DurationKnownEncoding.milliseconds, float)
    duration: duration,
  ): NoContentResponse;

  @route("/float64-milliseconds")
  @scenario
  @scenarioDoc("""
    Test float64 milliseconds encode for a duration header.
    Expected header `duration: 35625`
    """)
  op float64Milliseconds(
    @header
    @encode(DurationKnownEncoding.milliseconds, float64)
    duration: duration,
  ): NoContentResponse;

  @encode(DurationKnownEncoding.milliseconds, int32)
  scalar Int32MillisecondsDuration extends duration;

  @route("/int32-milliseconds-array")
  @scenario
  @scenarioDoc("""
    Test int32 milliseconds encode for a duration array header.
    Expected header `duration: [36000,47000]`
    """)
  op int32MillisecondsArray(
    @header
    duration: Int32MillisecondsDuration[],
  ): NoContentResponse;
}
