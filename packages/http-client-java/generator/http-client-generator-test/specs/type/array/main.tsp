import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Illustrates various types of arrays.")
@scenarioService("/type/array")
namespace Type.Array;

@doc("Template to have Array operations")
interface ArrayOperations<TArr, TDoc extends valueof string> {
  @scenario
  @scenarioDoc("""
    Expected Array response body:
    ```json
    ${TDoc}
    ```
    """)
  @get
  get(): TArr;

  @scenario
  @scenarioDoc("""
    Expected Array input body:
    ```json
    ${TDoc}
    ```
    """)
  @put
  put(@body body: TArr): void;
}

@doc("Array of int32 values")
@route("/int32")
interface Int32Value extends ArrayOperations<int32[], "[1, 2]"> {}

@doc("Array of int64 values")
@route("/int64")
interface Int64Value
  extends ArrayOperations<int64[], "[0x7FFFFFFFFFFFFFFF, -0x7FFFFFFFFFFFFFFF]"> {}

@doc("Array of boolean values")
@route("/boolean")
interface BooleanValue extends ArrayOperations<boolean[], "[true, false]"> {}

@doc("Array of string values")
@route("/string")
interface StringValue extends ArrayOperations<string[], "['hello', '']"> {}

@doc("Array of float values")
@route("/float32")
interface Float32Value extends ArrayOperations<float32[], "[43.125]"> {}

@doc("Array of datetime values")
@route("/datetime")
interface DatetimeValue extends ArrayOperations<utcDateTime[], "['2022-08-26T18:38:00Z']"> {}

@doc("Array of duration values")
@route("/duration")
interface DurationValue extends ArrayOperations<duration[], "['P123DT22H14M12.011S']"> {}

@doc("Array of unknown values")
@route("/unknown")
interface UnknownValue extends ArrayOperations<unknown[], "[1, 'hello', 'k3': null]"> {}

@doc("Array inner model")
model InnerModel {
  @doc("Required string property")
  property: string;

  children?: InnerModel[];
}

@doc("Array of model values")
@route("/model")
interface ModelValue
  extends ArrayOperations<InnerModel[], "[{'property': 'hello'}, {'property': 'world'}]"> {}

alias NullableFloat = float32 | null;
@doc("Array of nullable float values")
@route("/nullable-float")
interface NullableFloatValue extends ArrayOperations<NullableFloat[], "[1.25, null, 3.0]"> {}

alias NullableInt32 = int32 | null;
@doc("Array of nullable int32 values")
@route("/nullable-int32")
interface NullableInt32Value extends ArrayOperations<NullableInt32[], "[1, null, 3]"> {}

alias NullableBoolean = boolean | null;
@doc("Array of nullable boolean values")
@route("/nullable-boolean")
interface NullableBooleanValue extends ArrayOperations<NullableBoolean[], "[true, null, false]"> {}

alias NullableString = string | null;
@doc("Array of nullable string values")
@route("/nullable-string")
interface NullableStringValue
  extends ArrayOperations<NullableString[], "['hello', null, 'world']"> {}

alias NullableModel = InnerModel | null;
@doc("Array of nullable model values")
@route("/nullable-model")
interface NullableModelValue
  extends ArrayOperations<
      NullableModel[],
      "[{'property': 'hello'}, null, {'property': 'world'}]"
    > {}
