import "@typespec/http";
import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@doc("Illustrates models with optional properties.")
@scenarioService("/type/property/optional")
namespace Type.Property.Optional;

@doc("Template type for testing models with optional property. Pass in the type of the property you are looking for")
model ModelTemplate<TProperty> {
  @doc("Property")
  property?: TProperty;
}

@doc("Operations associated with getting and putting models with optional properties.")
interface OperationsTemplate<TModel, TDoc extends string, TDefaultDoc extends string = "{}"> {
  @doc("Get models that will return all properties in the model")
  @scenario
  @scenarioDoc(
    """
      Expected response body:
      ```json
      {"property": {allDoc}}
      ```
      """,
    {
      allDoc: TDoc,
    }
  )
  @route("/all")
  @get
  getAll(): TModel;

  @doc("Get models that will return the default object")
  @scenario
  @scenarioDoc(
    """
      Expected response body:
      ```json
      {defaultDoc}
      ```
      """,
    {
      defaultDoc: TDefaultDoc,
    }
  )
  @route("/default")
  @get
  getDefault(): TModel;

  @doc("Put a body with all properties present.")
  @scenario
  @scenarioDoc(
    """
      Expected request body:
      ```json
      {"property": {allDoc}}
      ```
      """,
    {
      allDoc: TDoc,
    }
  )
  @route("/all")
  @put
  putAll(@body body: TModel): void;

  @doc("Put a body with default properties.")
  @scenario
  @scenarioDoc(
    """
      Expected request body:
      ```json
      {defaultDoc}
      ```
      """,
    {
      defaultDoc: TDefaultDoc,
    }
  )
  @route("/default")
  @put
  putDefault(@body body: TModel): void;
}

// Model with optional string property
model StringProperty is ModelTemplate<string>;
@route("/string")
@operationGroup
interface String extends OperationsTemplate<StringProperty, "\"hello\""> {}

// Model with optional bytes property
model BytesProperty is ModelTemplate<bytes>;
@route("/bytes")
@operationGroup
interface Bytes extends OperationsTemplate<BytesProperty, "\"aGVsbG8sIHdvcmxkIQ==\""> {}

// Model with optional datetime property
@doc("Model with a datetime property")
model DatetimeProperty is ModelTemplate<utcDateTime>;
@route("/datetime")
@operationGroup
interface Datetime extends OperationsTemplate<DatetimeProperty, "\"2022-08-26T18:38:00Z\""> {}

// Model with optional duration property
@doc("Model with a duration property")
model DurationProperty is ModelTemplate<duration>;
@route("/duration")
@operationGroup
interface Duration extends OperationsTemplate<DurationProperty, "\"P123DT22H14M12.011S\""> {}

// Model with optional plainDate property
@doc("Model with a plainDate property")
model PlainDateProperty is ModelTemplate<plainDate>;
@route("/plainDate")
@operationGroup
interface PlainDate extends OperationsTemplate<PlainDateProperty, "\"2022-12-12\""> {}

// Model with optional  property
@doc("Model with a plainTime property")
model PlainTimeProperty is ModelTemplate<plainTime>;
@route("/plainTime")
@operationGroup
interface PlainTime extends OperationsTemplate<PlainTimeProperty, "\"13:06:12\""> {}

// Model with optional collection bytes property
@doc("Model with collection bytes properties")
model CollectionsByteProperty is ModelTemplate<bytes[]>;
@route("/collections/bytes")
@operationGroup
interface CollectionsByte
  extends OperationsTemplate<CollectionsByteProperty, "[\"aGVsbG8sIHdvcmxkIQ==\", \"aGVsbG8sIHdvcmxkIQ==\"]"> {}

// Model with optional collection models property
@doc("Model with collection models properties")
model CollectionsModelProperty is ModelTemplate<StringProperty[]>;
@route("/collections/model")
@operationGroup
interface CollectionsModel
  extends OperationsTemplate<CollectionsModelProperty, "[{'property': 'hello'}, {'property': 'world'}]"> {}

// Model with optional string literal property
@doc("Model with string literal property")
model StringLiteralProperty is ModelTemplate<"hello">;
@route("/string/literal")
@operationGroup
interface StringLiteral extends OperationsTemplate<StringLiteralProperty, "\"hello\""> {}

// Model with optional int literal property
@doc("Model with int literal property")
model IntLiteralProperty is ModelTemplate<1>;
@route("/int/literal")
@operationGroup
interface IntLiteral extends OperationsTemplate<IntLiteralProperty, "1"> {}

// Model with optional float literal property
@doc("Model with float literal property")
model FloatLiteralProperty is ModelTemplate<1.25>;
@route("/float/literal")
@operationGroup
interface FloatLiteral extends OperationsTemplate<FloatLiteralProperty, "1.25"> {}

// Model with optional boolean literal property
@doc("Model with boolean literal property")
model BooleanLiteralProperty is ModelTemplate<true>;
@route("/boolean/literal")
@operationGroup
interface BooleanLiteral extends OperationsTemplate<BooleanLiteralProperty, "true"> {}

// Model with union of string literal property
@doc("Model with union of string literal property")
model UnionStringLiteralProperty is ModelTemplate<"hello" | "world">;
@route("/union/string/literal")
@operationGroup
interface UnionStringLiteral extends OperationsTemplate<UnionStringLiteralProperty, "\"world\""> {}

// Model with union of int literal property
@doc("Model with union of int literal property")
model UnionIntLiteralProperty is ModelTemplate<1 | 2>;
@route("/union/int/literal")
@operationGroup
interface UnionIntLiteral extends OperationsTemplate<UnionIntLiteralProperty, "2"> {}

// Model with union of float literal property
@doc("Model with union of float literal property")
model UnionFloatLiteralProperty is ModelTemplate<1.25 | 2.375>;
@route("/union/float/literal")
@operationGroup
interface UnionFloatLiteral extends OperationsTemplate<UnionFloatLiteralProperty, "2.375"> {}

@doc("Model with required and optional properties")
model RequiredAndOptionalProperty {
  @doc("optional string property")
  optionalProperty?: string;

  @doc("required int property")
  requiredProperty: int32;
}
@doc("Test optional and required properties")
@route("/requiredAndOptional")
@operationGroup
interface RequiredAndOptional {
  @doc("Get models that will return all properties in the model")
  @scenario
  @scenarioDoc("""
    Expected response body:
    ```json
    {"optionalProperty": "hello", "requiredProperty": 42}
    ```
    """)
  @route("/all")
  @get
  getAll(): RequiredAndOptionalProperty;

  @doc("Get models that will return only the required properties")
  @scenario
  @scenarioDoc("""
    Expected response body:
    ```json
    {"requiredProperty": 42}
    ```
    """)
  @route("/requiredOnly")
  @get
  getRequiredOnly(): RequiredAndOptionalProperty;

  @doc("Put a body with all properties present.")
  @scenario
  @scenarioDoc("""
    Expected request body:
    ```json
    {"optionalProperty": "hello", "requiredProperty": 42}
    ```
    """)
  @route("/all")
  @put
  putAll(@body body: RequiredAndOptionalProperty): void;

  @doc("Put a body with only required properties.")
  @scenario
  @scenarioDoc("""
    Expected request body:
    ```json
    {"requiredProperty": 42}
    ```
    """)
  @route("/requiredOnly")
  @put
  putRequiredOnly(@body body: RequiredAndOptionalProperty): void;
}
