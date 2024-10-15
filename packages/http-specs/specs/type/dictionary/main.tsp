import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Illustrates various of dictionaries.")
@scenarioService("/type/dictionary")
namespace Type.Dictionary;

@doc("Template to have dictionary operations")
interface DictionaryOperations<TDict, TDoc extends valueof string> {
  @scenario
  @scenarioDoc("""
    Expected dictionary response body:
    ```json
    ${TDoc}
    ```
    """)
  @get
  get(): TDict;

  @scenario
  @scenarioDoc("""
    Expected dictionary input body:
    ```json
    ${TDoc}
    ```
    """)
  @put
  put(@body body: TDict): void;
}

@doc("Dictionary of int32 values")
@route("/int32")
interface Int32Value extends DictionaryOperations<Record<int32>, "{'k1': 1, 'k2': 2}"> {}

@doc("Dictionary of int64 values")
@route("/int64")
interface Int64Value
  extends DictionaryOperations<
      Record<int64>,
      "{'k1': 0x7FFFFFFFFFFFFFFF, 'k2': -0x7FFFFFFFFFFFFFFF}"
    > {}

@doc("Dictionary of boolean values")
@route("/boolean")
interface BooleanValue extends DictionaryOperations<Record<boolean>, "{'k1': true, 'k2': false}"> {}

@doc("Dictionary of string values")
@route("/string")
interface StringValue extends DictionaryOperations<Record<string>, "{'k1': 'hello', 'k2': ''}"> {}

@doc("Dictionary of float values")
@route("/float32")
interface Float32Value extends DictionaryOperations<Record<float32>, "{'k1': 43.125}"> {}

@doc("Dictionary of datetime values")
@route("/datetime")
interface DatetimeValue
  extends DictionaryOperations<Record<utcDateTime>, "{'k1': '2022-08-26T18:38:00Z'}"> {}

@doc("Dictionary of duration values")
@route("/duration")
interface DurationValue
  extends DictionaryOperations<Record<duration>, "{'k1': 'P123DT22H14M12.011S'}"> {}

@doc("Dictionary of unknown values")
@route("/unknown")
interface UnknownValue
  extends DictionaryOperations<Record<unknown>, "{'k1': 1, 'k2': 'hello', 'k3': null}"> {}

@doc("Dictionary inner model")
model InnerModel {
  @doc("Required string property")
  property: string;

  children?: Record<InnerModel>;
}

@doc("Dictionary of model values")
@route("/model")
interface ModelValue
  extends DictionaryOperations<
      Record<InnerModel>,
      "{'k1': {'property': 'hello'}, 'k2': {'property': 'world'}}"
    > {}

@doc("Dictionary of model values")
@route("/model/recursive")
interface RecursiveModelValue
  extends DictionaryOperations<
      Record<InnerModel>,
      "{'k1': {'property': 'hello', children: {}}, 'k2': {'property': 'world', children: {'k2.1': {'property': 'inner world'}}}}"
    > {}

alias NullableFloat = float32 | null;
@doc("Dictionary of nullable float values")
@route("/nullable-float")
interface NullableFloatValue
  extends DictionaryOperations<Record<NullableFloat>, "{'k1': 1.25, 'k2': 0.5, 'k3': null}"> {}
