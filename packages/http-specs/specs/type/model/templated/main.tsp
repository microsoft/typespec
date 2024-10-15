import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Illustrates the model templated cases. There is a base templated type and an instantiated type extending from it.
 */
@scenarioService("/type/model/templated")
namespace Type.Model.Templated;

@friendlyName("{name}Type", T)
model NumericType<T extends numeric> {
  /**
   * An array of numeric values.
   */
  values: T[];

  value: T;
}

/**
 * An instantiated type representing int32 values type.
 */
model Int32ValuesType extends NumericType<int32> {
  /**
   * The Kind of the Int32ValuesType.
   */
  kind: "Int32Values";
}

/**
 * An instantiated type representing float32 values type.
 */
model Float32ValuesType extends NumericType<float32> {
  /**
   * The Kind of the Float32ValuesType.
   */
  kind: "Float32Values";
}

@scenario
@scenarioDoc("""
  Expected input body:
  ```json
  {
    "kind": "Int32Values",
    "values": 
    [
      1234
    ],
    "value": 1234
  }
  ```
  
  Expected response body:
  ```json
  {
    "values": 
    [
      1234
    ],
    "value": 1234
  }
  ```
  """)
@route("/numericType")
@put
op numericType(@body input: NumericType<int32>): NumericType<int32>;

@scenario
@scenarioDoc("""
  Expected input body:
  ```json
  {
    "kind": "Float32Values",
    "values": 
    [
      0.5
    ],
    "value": 0.5
  }
  ```
  
  Expected response body:
  ```json
  {
    "kind": "Float32Values",
    "values": 
    [
      0.5
    ],
    "value": 0.5
  }
  ```
  """)
@route("/float32ValuesType")
@put
op float32Type(@body input: Float32ValuesType): Float32ValuesType;

@scenario
@scenarioDoc("""
  Expected input body:
  ```json
  {
    "kind": "Int32Values",
    "values": 
    [
      1234
    ],
    "value": 1234
  }
  ```
  
  Expected response body:
  ```json
  {
    "kind": "Int32Values",
    "values": 
    [
      1234
    ],
    "value": 1234
  }
  ```
  """)
@route("/int32ValuesType")
@put
op int32Type(@body input: Int32ValuesType): Int32ValuesType;
