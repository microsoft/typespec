import "@typespec/http";
import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@doc("Illustrates models with nullable properties.")
@scenarioService("/type/property/nullable")
namespace Type.Property.Nullable;

@doc("Template type for testing models with nullable property. Pass in the type of the property you are looking for")
model ModelTemplate<TProperty> {
  @doc("Required property")
  requiredProperty: string;

  @doc("Property")
  nullableProperty: TProperty | null;
}

@doc("Operations associated with getting and putting models with nullable properties.")
interface OperationsTemplate<TModel, TDoc extends string, TDefaultDoc extends string = "null"> {
  @doc("Get models that will return all properties in the model")
  @scenario
  @scenarioDoc(
    """
      Expected response body:
      ```json
      { "requiredProperty": "foo", "nullableProperty": {allDoc}}
      ```
      """,
    {
      allDoc: TDoc,
    }
  )
  @route("/non-null")
  @get
  getNonNull(): TModel;

  @doc("Get models that will return the default object")
  @scenario
  @scenarioDoc(
    """
      Expected response body:
      ```json
      { "requiredProperty": "foo", "nullableProperty": {defaultDoc}}
      ```
      """,
    {
      defaultDoc: TDefaultDoc,
    }
  )
  @route("/null")
  @get
  getNull(): TModel;

  @doc("Put a body with all properties present.")
  @scenario
  @scenarioDoc(
    """
      Expected request body:
      ```json
      { "requiredProperty": "foo", "nullableProperty": {allDoc}}
      ```
      """,
    {
      allDoc: TDoc,
    }
  )
  @route("/non-null")
  @patch
  patchNonNull(
    @doc("content-type is application/merge-patch+json")
    @header("Content-Type")
    contentType: "application/merge-patch+json",

    @body body: TModel,
  ): void;

  @doc("Put a body with default properties.")
  @scenario
  @scenarioDoc(
    """
      Expected request body:
      ```json
      { "requiredProperty": "foo", "nullableProperty": {defaultDoc}}
      ```
      """,
    {
      defaultDoc: TDefaultDoc,
    }
  )
  @route("/null")
  @patch
  patchNull(
    @doc("content-type is application/merge-patch+json")
    @header("Content-Type")
    contentType: "application/merge-patch+json",

    @body body: TModel,
  ): void;
}

// Model with nullable string property
model StringProperty is ModelTemplate<string>;
@route("/string")
@operationGroup
interface String extends OperationsTemplate<StringProperty, "hello"> {}

// Model with nullable bytes property
model BytesProperty is ModelTemplate<bytes>;
@route("/bytes")
@operationGroup
interface Bytes extends OperationsTemplate<BytesProperty, "aGVsbG8sIHdvcmxkIQ=="> {}

// Model with nullable datetime property
@doc("Model with a datetime property")
model DatetimeProperty is ModelTemplate<utcDateTime>;
@route("/datetime")
@operationGroup
interface Datetime extends OperationsTemplate<DatetimeProperty, "2022-08-26T18:38:00Z"> {}

// Model with nullable duration property
@doc("Model with a duration property")
model DurationProperty is ModelTemplate<duration>;
@route("/duration")
@operationGroup
interface Duration extends OperationsTemplate<DurationProperty, "P123DT22H14M12.011S"> {}

// Model with nullable collection bytes property
@doc("Model with collection bytes properties")
model CollectionsByteProperty is ModelTemplate<bytes[]>;
@route("/collections/bytes")
@operationGroup
interface CollectionsByte
  extends OperationsTemplate<CollectionsByteProperty, "[aGVsbG8sIHdvcmxkIQ==, aGVsbG8sIHdvcmxkIQ==]"> {}

// Model with nullable collection models property
@doc("Inner model used in collections model property")
model InnerModel {
  @doc("Inner model property")
  property: string;
}
@doc("Model with collection models properties")
model CollectionsModelProperty is ModelTemplate<InnerModel[]>;
@route("/collections/model")
@operationGroup
interface CollectionsModel
  extends OperationsTemplate<CollectionsModelProperty, "[{'property': 'hello'}, {'property': 'world'}]"> {}

// Model with nullable collection string property
@doc("Model with collection string properties")
model CollectionsStringProperty is ModelTemplate<string[]>;
@route("/collections/string")
@operationGroup
interface CollectionsString extends OperationsTemplate<CollectionsStringProperty, "['hello', 'world']"> {}
