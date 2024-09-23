import "@typespec/http";
import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@doc("Illustrates various property types for models")
@scenarioService("/type/property/value-types")
namespace Type.Property.ValueTypes;

// TEMPLATES
@doc("Template type for testing models with specific properties. Pass in the type of the property you are looking for")
model ModelTemplate<TProperty> {
  @doc("Property")
  property: TProperty;
}

@doc("Template to have models operations")
interface ModelOperations<TModel, TDoc extends string> {
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc(
    """
      Expected response body:
      ```json
      {"property": {doc}}
      ```
      """,
    {
      doc: TDoc,
    }
  )
  @get
  @doc("Get call")
  get(): TModel;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc(
    """
      Expected input body:
      ```json
      {"property": {doc}}
      ```
      """,
    {
      doc: TDoc,
    }
  )
  @put
  @doc("Put operation")
  put(@body @doc("body") body: TModel): void;
}

// Test a model with a boolean property
@doc("Model with a boolean property")
model BooleanProperty is ModelTemplate<boolean>;
@route("/boolean")
@operationGroup
interface Boolean extends ModelOperations<BooleanProperty, "true"> {}

// Test a model with a string property
@doc("Model with a string property")
model StringProperty is ModelTemplate<string>;
@route("/string")
@operationGroup
interface String extends ModelOperations<StringProperty, "\"hello\""> {}

// Test a model with a bytes property
@doc("Model with a bytes property")
model BytesProperty is ModelTemplate<bytes>;
@route("/bytes")
@operationGroup
interface Bytes extends ModelOperations<BytesProperty, "aGVsbG8sIHdvcmxkIQ=="> {}

// Test a model with an int property
@doc("Model with a int property")
model IntProperty is ModelTemplate<int32>;
@route("/int")
@operationGroup
interface Int extends ModelOperations<IntProperty, "42"> {}

// Test a model with a float property
@doc("Model with a float property")
model FloatProperty is ModelTemplate<float32>;
@route("/float")
@operationGroup
interface Float extends ModelOperations<FloatProperty, "43.125"> {}

// Test a model with a decimal property
@doc("Model with a decimal property")
model DecimalProperty is ModelTemplate<decimal>;
@route("/decimal")
@operationGroup
interface Decimal extends ModelOperations<DecimalProperty, "0.33333"> {}

// Test a model with a decimal128 property
@doc("Model with a decimal128 property")
model Decimal128Property is ModelTemplate<decimal128>;
@route("/decimal128")
@operationGroup
interface Decimal128 extends ModelOperations<Decimal128Property, "0.33333"> {}

// Test a model with a datetime property
@doc("Model with a datetime property")
model DatetimeProperty is ModelTemplate<utcDateTime>;
@route("/datetime")
@operationGroup
interface Datetime extends ModelOperations<DatetimeProperty, "2022-08-26T18:38:00Z"> {}

// Test a model with a duration property
@doc("Model with a duration property")
model DurationProperty is ModelTemplate<duration>;
@route("/duration")
@operationGroup
interface Duration extends ModelOperations<DurationProperty, "P123DT22H14M12.011S"> {}

// Test a model with an enum property
@doc("Enum that will be used as a property for model EnumProperty. Extensible.")
union InnerEnum {
  string,

  @doc("First value.")
  ValueOne: "ValueOne",

  @doc("Second value.")
  ValueTwo: "ValueTwo",
}

#suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "For testing"
@doc("Enum that will be used as a property for model EnumProperty. Non-extensible.")
@Azure.Core.fixed
enum FixedInnerEnum {
  @doc("First value.")
  ValueOne,

  @doc("Second value.")
  ValueTwo,
}

@doc("Model with enum properties")
model EnumProperty is ModelTemplate<FixedInnerEnum>;
@route("/enum")
@operationGroup
interface Enum extends ModelOperations<EnumProperty, "\"ValueOne\""> {}

@doc("Model with extensible enum properties")
model ExtensibleEnumProperty is ModelTemplate<InnerEnum>;
@route("/extensible-enum")
@operationGroup
interface ExtensibleEnum extends ModelOperations<ExtensibleEnumProperty, "\"UnknownValue\""> {}

// Test a model with a model property
@doc("Inner model. Will be a property type for ModelWithModelProperties")
model InnerModel {
  @doc("Required string property")
  property: string;
}
@doc("Model with model properties")
model ModelProperty is ModelTemplate<InnerModel>;
@route("/model")
@operationGroup
interface Model extends ModelOperations<ModelProperty, "{'property': 'hello'}"> {}

// Test a model with a string collection property
@doc("Model with collection string properties")
model CollectionsStringProperty is ModelTemplate<string[]>;
@route("/collections/string")
@operationGroup
interface CollectionsString extends ModelOperations<CollectionsStringProperty, "['hello', 'world']"> {}

// Test a model with an int collection property
@doc("Model with collection int properties")
model CollectionsIntProperty is ModelTemplate<int32[]>;
@route("/collections/int")
@operationGroup
interface CollectionsInt extends ModelOperations<CollectionsIntProperty, "[1, 2]"> {}

// Test a model with a model collection property
@doc("Model with collection model properties")
model CollectionsModelProperty is ModelTemplate<InnerModel[]>;
@route("/collections/model")
@operationGroup
interface CollectionsModel
  extends ModelOperations<CollectionsModelProperty, "[{'property': 'hello'}, {'property': 'world'}]"> {}

// Test a model with a string dictionary property
@doc("Model with dictionary string properties")
model DictionaryStringProperty is ModelTemplate<Record<string>>;
@route("/dictionary/string")
@operationGroup
interface DictionaryString extends ModelOperations<DictionaryStringProperty, "{'k1': 'hello', 'k2': 'world'}"> {}

// Test a model with a never property
@doc("Model with a property never. (This property should not be included).")
model NeverProperty is ModelTemplate<never>;
@route("/never")
@operationGroup
interface Never extends ModelOperations<NeverProperty, "<don't include this property>"> {}

// Test a model with unknown and string
@doc("Model with a property unknown, and the data is a string.")
model UnknownStringProperty is ModelTemplate<unknown>;
@route("/unknown/string")
@operationGroup
interface UnknownString extends ModelOperations<UnknownStringProperty, "\"hello\""> {}

// Test a model with unknown and int
@doc("Model with a property unknown, and the data is a int32.")
model UnknownIntProperty is ModelTemplate<unknown>;
@route("/unknown/int")
@operationGroup
interface UnknownInt extends ModelOperations<UnknownIntProperty, "42"> {}

// Test a model with unknown and a dictionnary
@doc("Model with a property unknown, and the data is a dictionnary.")
model UnknownDictProperty is ModelTemplate<unknown>;
@route("/unknown/dict")
@operationGroup
interface UnknownDict extends ModelOperations<UnknownDictProperty, "{'k1': 'hello', 'k2': 42}"> {}

// Test a model with unknown and an array
@doc("Model with a property unknown, and the data is an array.")
model UnknownArrayProperty is ModelTemplate<unknown>;
@route("/unknown/array")
@operationGroup
interface UnknownArray extends ModelOperations<UnknownArrayProperty, "['hello', 'world']"> {}

@doc("Model with a string literal property.")
model StringLiteralProperty is ModelTemplate<"hello">;
@route("/string/literal")
@operationGroup
interface StringLiteral extends ModelOperations<StringLiteralProperty, "\"hello\""> {}

@doc("Model with a int literal property.")
model IntLiteralProperty is ModelTemplate<42>;
@route("/int/literal")
@operationGroup
interface IntLiteral extends ModelOperations<IntLiteralProperty, "42"> {}

@doc("Model with a float literal property.")
model FloatLiteralProperty is ModelTemplate<43.125>;
@route("/float/literal")
@operationGroup
interface FloatLiteral extends ModelOperations<FloatLiteralProperty, "43.125"> {}

@doc("Model with a boolean literal property.")
model BooleanLiteralProperty is ModelTemplate<true>;
@route("/boolean/literal")
@operationGroup
interface BooleanLiteral extends ModelOperations<BooleanLiteralProperty, "true"> {}

@doc("Model with a union of string literal as property.")
model UnionStringLiteralProperty is ModelTemplate<"hello" | "world">;
@route("/union/string/literal")
@operationGroup
interface UnionStringLiteral extends ModelOperations<UnionStringLiteralProperty, "\"world\""> {}

@doc("Model with a union of int literal as property.")
model UnionIntLiteralProperty is ModelTemplate<42 | 43>;
@route("/union/int/literal")
@operationGroup
interface UnionIntLiteral extends ModelOperations<UnionIntLiteralProperty, "42"> {}

@doc("Model with a union of float literal as property.")
model UnionFloatLiteralProperty is ModelTemplate<43.125 | 46.875>;
@route("/union/float/literal")
@operationGroup
interface UnionFloatLiteral extends ModelOperations<UnionFloatLiteralProperty, "46.875"> {}

union ExtendedEnum {
  string,
  EnumValue2: "value2",
}

model UnionEnumValueProperty is ModelTemplate<ExtendedEnum.EnumValue2>;

@route("/union-enum-value")
@operationGroup
interface UnionEnumValue extends ModelOperations<UnionEnumValueProperty, "\"value2\""> {}
