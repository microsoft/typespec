import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";
import "@typespec/versioning";

using TypeSpec.Http;
using TypeSpec.Rest;
using Azure.ClientGenerator.Core;
using Azure.Core;
using TypeSpec.Versioning;

@versioned(Versions)
@service(
    {
        title: "Models in CADL"
    }
)
@server(
    "{endpoint}",
    "Endpoint Service",
    {
        endpoint: string,
    }
)
@doc("CADL project to test various types of models.")
namespace ModelsTypeSpec;

enum Versions {
  @useDependency(Azure.Core.Versions.v1_0_Preview_1)
  "0.1.0"
}

@doc("A base model with a required property")
model BaseModelWithARequiredProperty {
    @doc("Required kind")
    kind: string;
}

@doc("A base model in the discriminated set inheriting from a base with the predefined discriminator property")
@discriminator("kind")
model BaseModelWithDiscriminatorDefinedOnBase extends BaseModelWithARequiredProperty {
    @doc("Optional string.")
    optionalString?: string;
}

@doc("A derived class in the discriminated set inheriting from a base with the predefined discriminator property")
model DerivedWithDiscriminatorDefinedOnBase extends BaseModelWithDiscriminatorDefinedOnBase {
    kind: "A";

    @doc("Required string.")
    requiredString: string;

    @doc("Optional int")
    optionalInt?: int32;
}

@doc("Base model")
model BaseModel {
}

@doc("Base model with properties")
model BaseModelWithProperties {
  @doc("Optional properties on base")
  optionalPropertyOnBase?: string;
}

@doc("Derived model")
model DerivedModel extends BaseModel {
  @doc("Required collection")
  requiredList: CollectionItem[];
}

@doc("Derived model with properties")
model DerivedModelWithProperties extends BaseModelWithProperties {
  @doc("Required collection")
  requiredList: CollectionItem[];
}

@discriminator("discriminatorProperty")
@doc("Base model with discriminator property.")
model BaseModelWithDiscriminator {
  @doc("Optional property on base")
  optionalPropertyOnBase?: string;

  @doc("Required property on base")
  requiredPropertyOnBase: int32;
}

@doc("Deriver model with discriminator property.")
model DerivedModelWithDiscriminatorA extends BaseModelWithDiscriminator {
  discriminatorProperty: "A";

  @doc("Required string.")
  requiredString: string;
}

@doc("Deriver model with discriminator property.")
model DerivedModelWithDiscriminatorB extends BaseModelWithDiscriminator {
  discriminatorProperty: "B";

  @doc("Required int.")
  requiredInt: int32;
}


@doc("Collection item model")
model CollectionItem {
    @doc("Required model record")
    requiredModelRecord: Record<RecordItem>;
}

@doc("Record item model")
model RecordItem extends DerivedModel {
    
}

@doc("Fixed string enum")
@fixed
enum FixedStringEnum {
    One: "1",
    Two: "2",
    Four: "4"
}

@doc("Fixed int enum")
@fixed
@deprecated("deprecated for test")
enum FixedIntEnum {
    One: 1,
    Two: 2,
    Four: 4
}

@doc("Fixed float enum")
@fixed
@deprecated("should be replaced by cadl-ranch")
enum FixedFloatEnum {
    One: 1.1,
    Two: 2.1,
    Four: 4.0
}

@doc("Extensible enum")
@deprecated("deprecated for test")
enum ExtensibleEnum {
    One: "1",
    Two: "2",
    Four: "4"
}

@doc("Extensible int enum")
@deprecated("should be replaced by cadl-ranch")
enum ExtensibleIntEnum {
    One: 1,
    Two: 2,
    Four: 4
}


@doc("Model used both as input and output")
model RoundTripModel extends BaseModel {
  @doc("Required string, illustrating a reference type property.")
  requiredString: string;

  @doc("Required int, illustrating a value type property.")
  requiredInt: int32;

  @doc("Optional string")
  nonRequiredString?: string;

  @doc("Optional int")
  nonRequiredInt?: int32;

  @doc("Required nullable int")
  requiredNullableInt: int32 | null;

  @doc("Required nullable string")
  requiredNullableString: string | null;

  @doc("Optional nullable int")
  nonRequiredNullableInt?: int32 | null;

  @doc("Optional nullable string")
  nonRequiredNullableString?: string | null;
  
  @doc("Required readonly int")
  @visibility("read")
  requiredReadonlyInt: int32;

  @doc("Optional readonly int")
  @visibility("read")
  nonRequiredReadonlyInt?: int32;

  @doc("Required model with discriminator")
  requiredModel: BaseModelWithDiscriminator;

  @doc("Required fixed string enum")
  requiredFixedStringEnum: FixedStringEnum;

  @doc("Required fixed int enum")
  requiredFixedIntEnum: FixedIntEnum;

//   @doc("Required fixed float enum")
//   requiredFixedFloatEnum: FixedFloatEnum;

  @doc("Required extensible enum")
  requiredExtensibleEnum: ExtensibleEnum;

  @doc("Required collection")
  requiredList: CollectionItem[];

  @doc("Required int record")
  requiredIntRecord: Record<int32>;

  @doc("Required string record")
  requiredStringRecord: Record<string>;

  @doc("Required Model Record")
  requiredModelRecord: Record<RecordItem>;

  @doc("Required bytes")
  requiredBytes: bytes;

  @doc("Optional bytes")
  optionalBytes?: bytes;

  @doc("Required uint8[]")
  requiredUint8Array: uint8[];

  @doc("Optional uint8[]")
  optionalUint8Array?: uint8[];
  
  @doc("Required unknown")
  requiredUnknown: unknown;

  @doc("Optional unknown")
  optionalUnknown?: unknown;

  @doc("Required int8[]")
  requiredInt8Array: int8[];

  @doc("Optional int8[]")
  optionalInt8Array?: int8[];

  @doc("Required nullable int list")
  requiredNullableIntList: int32[] | null;

  @doc("Required nullable string list")
  requiredNullableStringList: string[] | null;

  @doc("Optional nullable model list")
  nonRequiredNullableIntList?: int32[] | null;

  @doc("Optional nullable string list")
  nonRequiredNullableStringList?: string[] | null;
}

@doc("Model used both as input and output with primitive types")
model RoundTripPrimitiveModel extends BaseModel {
  @doc("Required string, illustrating a reference type property.")
  requiredString: string;

  @doc("Required int, illustrating a value type property.")
  requiredInt: int32;

  @doc("Required int64, illustrating a value type property.")
  requiredInt64: int64;

  @doc("Required safeint, illustrating a value type property.")
  requiredSafeInt: safeint;

  @doc("Required float, illustrating a value type property.")
  requiredFloat: float32;

  @doc("Required double, illustrating a value type property.")
  required_Double: float64;

  @doc("Required bolean, illustrating a value type property.")
  requiredBoolean: boolean;

  @doc("Required date time offset, illustrating a reference type property.")
  requiredDateTimeOffset: utcDateTime;

  @doc("Required time span, illustrating a value type property.")
  requiredTimeSpan: duration;

  @doc("Required collection of which the element is a nullable float")
  requiredCollectionWithNullableFloatElement: (float32 | null) [];
}

@doc("Model used only as input")
model InputModel {
  @doc("Required string")
  requiredString: string;

  @doc("Required int")
  requiredInt: int32;

  @doc("Required nullable int")
  requiredNullableInt: int32 | null;

  @doc("Required nullable string")
  requiredNullableString: string | null;

  @doc("Optional nullable int")
  nonRequiredNullableInt?: int32 | null;

  @doc("Optional nullable string")
  nonRequiredNullableString?: string | null;

  @doc("Required model")
  requiredModel: BaseModel;

  @doc("Required model")
  requiredModel2: BaseModel;

  @doc("Required primitive value type collection")
  requiredIntList: int32[];

  @doc("Required primitive reference type collection")
  requiredStringList: string[];

  @doc("Required model collection")
  requiredModelList: CollectionItem[];

  @doc("Required model record")
  requiredModelRecord: Record<RecordItem>;

  @doc("Required collection of which the element is a nullable float")
  requiredCollectionWithNullableFloatElement: (null | float32) [];

  @doc("Required collection of which the element is a nullable boolean")
  requiredCollectionWithNullableBooleanElement: (boolean | null) [];

  @doc("Required model nullable collection")
  requiredNullableModelList: CollectionItem[] | null;

  @doc("Required string nullable collection")
  requiredNullableStringList: string[] | null;

  @doc("Required int nullable collection")
  requiredNullableIntList: int32[] | null;

  @doc("Optional model collection")
  nonRequiredModelList?: CollectionItem[];

  @doc("Optional string collection")
  nonRequiredStringList?: string[];

  @doc("Optional int collection")
  nonRequiredIntList?: int32[];

  @doc("Optional model nullable collection")
  nonRequiredNullableModelList?: CollectionItem[] | null;

  @doc("Optional string nullable collection")
  nonRequiredNullableStringList?: string[] | null;

  @doc("Optional int nullable collection")
  nonRequiredNullableIntList?: int32[] | null;
}

@doc("Model used only as output")
model OutputModel {
  @doc("Required string")
  requiredString: string;

  @doc("Required int")
  requiredInt: int32;

  @doc("Required model")
  requiredModel: DerivedModel;

  @doc("Required collection")
  requiredList: CollectionItem[];

  @doc("Required model record")
  requiredModelRecord: Record<RecordItem>;

  @doc("Optional model collection")
  optionalList?: CollectionItem[];

  @doc("Optional model nullable collection")
  optionalNullableList?: CollectionItem[] | null;

  @doc("Optional model record")
  optionalRecord?: Record<RecordItem>;

  @doc("Optional model nullable record")
  optionalNullableRecord?: Record<RecordItem> | null;
}

@doc("RoundTrip model with optional properties.")
@deprecated("deprecated for test")
model RoundTripOptionalModel {
  @doc("Optional string, illustrating an optional reference type property.")
  optionalString?: string;

  @doc("Optional int, illustrating an optional value type property.")
  optionalInt?: int32;

  @doc("Optional string collection.")
  optionalStringList?: string[];
  
  @doc("Optional int collection.")
  optionalIntList?: int32[];

  @doc("Optional model collection")
  optionalModelList?: CollectionItem[];

  @doc("Optional model.")
  optionalModel?: DerivedModel;

  @doc("Optional model with properties on base")
  optionalModelWithPropertiesOnBase?: DerivedModelWithProperties;

  @doc("Optional fixed string enum")
  optionalFixedStringEnum?: FixedStringEnum;

  @doc("Optional extensible enum")
  optionalExtensibleEnum?: ExtensibleEnum;

  @doc("Optional int record")
  optionalIntRecord?: Record<int32>;

  @doc("Optional string record")
  optionalStringRecord?: Record<string>;

  @doc("Optional model record")
  optionalModelRecord?: Record<RecordItem>;

  @doc("Optional plainDate")
  optionalPlainDate?: plainDate;

  @doc("Optional plainTime")
  optionalPlainTime?: plainTime;

  @doc("Optional collection of which the element is a nullable int")
  optionalCollectionWithNullableIntElement?: (int32 | null) [];
}

@doc("Output model with readonly properties.")
model RoundTripReadOnlyModel {
  @doc("Required string, illustrating a readonly reference type property.")
  @visibility("read")
  requiredReadonlyString: string;

  @doc("Required int, illustrating a readonly value type property.")
  @visibility("read")
  requiredReadonlyInt: int32;

  @doc("Optional string, illustrating a readonly reference type property.")
  @visibility("read")
  optionalReadonlyString?: string;

  @doc("Optional int, illustrating a readonly value type property.")
  @visibility("read")
  optionalReadonlyInt?: int32;

  @doc("Required readonly model.")
  @visibility("read")
  requiredReadonlyModel: DerivedModel;

  @doc("Optional readonly model.")
  @visibility("read")
  optionalReadonlyModel?: DerivedModel;

  @doc("Required readonly fixed string enum")
  @visibility("read")
  requiredReadonlyFixedStringEnum: FixedStringEnum;

  @doc("Required readonly extensible enum")
  @visibility("read")
  requiredReadonlyExtensibleEnum: ExtensibleEnum;

  @doc("Optional readonly fixed string enum")
  @visibility("read")
  optionalReadonlyFixedStringEnum: FixedStringEnum;

  @doc("Optional readonly extensible enum")
  @visibility("read")
  optionalReadonlyExtensibleEnum: ExtensibleEnum;

  @doc("Required readonly string collection.")
  @visibility("read")
  requiredReadonlyStringList: string[];

  @doc("Required readonly int collection.")
  @visibility("read")
  requiredReadonlyIntList: int32[];

  @doc("Required model collection")
  @visibility("read")
  requiredReadOnlyModelList: CollectionItem[];

  @doc("Required int record")
  @visibility("read")
  requiredReadOnlyIntRecord: Record<int32>;

  @doc("Required string record")
  @visibility("read")
  requiredStringRecord: Record<string>;

  @doc("Required model record")
  @visibility("read")
  requiredReadOnlyModelRecord: Record<RecordItem>;

  @doc("Optional readonly string collection.")
  @visibility("read")
  optionalReadonlyStringList?: string[];

  @doc("Optional readonly int collection.")
  @visibility("read")
  optionalReadonlyIntList?: int32[];

  @doc("Optional model collection")
  @visibility("read")
  optionalReadOnlyModelList?: CollectionItem[];

  @doc("Optional int record")
  optionalReadOnlyIntRecord: Record<int32>;

  @doc("Optional string record")
  optionalReadOnlyStringRecord: Record<string>;

  @doc("Optional model record")
  @visibility("read")
  optionalModelRecord?: Record<RecordItem>;

  @doc("Required collection of which the element is a nullable int")
  requiredCollectionWithNullableIntElement: (null | int32) [];

  @doc("Optional collection of which the element is a nullable boolean")
  optionalCollectionWithNullableBooleanElement?: (boolean | null) [];
}

@doc("Output model that has property of its own type")
model ErrorModel {
  @doc("Error message")
  @visibility("read")
  message: string;

  @doc("Required Record")
  @visibility("read")
  innerError?: ErrorModel;
}

@doc("Input model that has property of its own type")
model InputRecursiveModel {
  @doc("Message")
  message: string;

  @doc("Required Record")
  inner?: InputRecursiveModel;
}

@doc("Roundtrip model that has property of its own type")
model RoundTripRecursiveModel {
  @doc("Message")
  message: string;

  @doc("Required Record")
  inner?: RoundTripRecursiveModel;
}

@doc("Output model with a discriminator")
@discriminator("kind")
model OutputBaseModelWithDiscriminator {
}

@doc("First derived model as an output")
model FirstDerivedOutputModel extends OutputBaseModelWithDiscriminator {
  kind: "first";
  first: boolean;
}

@doc("Second derived model as an output")
model SecondDerivedOutputModel extends OutputBaseModelWithDiscriminator {
  kind: "second";
  second: boolean;
}

@route("/roundTripToDiscriminatorDefinedOnBase")
@put
@convenientAPI(true)
op putBaseModelWithDiscriminatorDefinedOnBase(@body body: BaseModelWithDiscriminatorDefinedOnBase): BaseModelWithDiscriminatorDefinedOnBase;

@route("/pet")
@get
@convenientAPI(true)
op getOutputDiscriminatorModel(): OutputBaseModelWithDiscriminator;

@doc("Input model that has property of its own type")
@route("/inputToRoundTrip")
@doc("Input to RoundTrip")
@get
@convenientAPI(true)
op inputToRoundTrip(@body input: InputModel): RoundTripModel;

@route("/inputToRoundTripPrimitive")
@doc("Input to RoundTripPrimitive")
@get
@convenientAPI(true)
op inputToRoundTripPrimitive(@body input: InputModel): RoundTripPrimitiveModel;

@route("/inputToRoundTripOptional")
@doc("Input to RoundTripOptional")
@get
@convenientAPI(true)
op inputToRoundTripOptional(@body input: RoundTripOptionalModel): RoundTripOptionalModel;

@route("/inputToRoundTripReadOnly")
@doc("Input to RoundTripReadOnly")
@get
@convenientAPI(true)
@deprecated("deprecated for test")
op inputToRoundTripReadOnly(@body input: InputModel): RoundTripReadOnlyModel;

@route("/roundTripToOutput")
@doc("RoundTrip to Output")
@get
@convenientAPI(true)
op roundTripToOutput(@body input: RoundTripModel): OutputModel;

@route("/inputRecursive")
@doc("Input recursive model")
@post
@convenientAPI(true)
op InputRecursive(@body input: InputRecursiveModel): Response<200>|ErrorModel;

@route("/roundTripRecursive")
@doc("RoundTrip recursive model")
@put
@convenientAPI(true)
op roundTripRecursive(@body input: RoundTripRecursiveModel): RoundTripRecursiveModel;

@route("/selfReference")
@doc("Returns model that has property of its own type")
@get
@convenientAPI(true)
op selfReference(): ErrorModel;

@route("/fixedFloatEnum")
@doc("Returns model that has property of its own type")
@get
@convenientAPI(true)
op fixedFloatEnum(@query input: FixedFloatEnum): OutputModel;

@route("/extenisbleIntEnum")
@doc("Returns model that has property of its own type")
@get
@convenientAPI(true)
op extenisbleIntEnum(@query input: ExtensibleIntEnum): OutputModel;

@doc("Base model")
model NoUseBase {
  @doc("base model property")
  baseModelProp: string;
}

@doc("Derived model")
model RoundTripOnNoUse extends NoUseBase {
  @doc("Required collection")
  requiredList: CollectionItem[];
}

@doc("Returns RoundTripOnNoUse")
@get
@convenientAPI(true)
op roundTripToOutputWithNoUseBase(@body input: RoundTripOnNoUse): RoundTripOnNoUse;

@doc("This is a model.")
@resource("items")
model Foo {
  @doc("id of Foo")
  @key
  @visibility("read","create","query")
  id: string;
  @doc("name of Foo")
  name: string;
}

@convenientAPI(true)
op analyzeConversation is Azure.Core.StandardResourceOperations.ResourceCollectionAction<
  Foo,
  {},
  BaseModelWithDiscriminator
>;

@doc("Single base model without any child model.")
@discriminator("kind")
model SingleBase {
    size: int32;
}

@route("/single")
@get
@convenientAPI(true)
op getSingleBase(): SingleBase;
@doc("Facet")
model Facet {
   @doc("A field to facet by, where the field is attributed as 'facetable'")
   field: string;  
}

model NumericValuesFacet<T extends numeric> extends Facet {
  @doc("The facet ranges to produce. The values must be listed in ascending order to get the expected results. For example, values=10,20 produces three buckets: one for base rate 0 up to but not including 10, one for 10 up to but not including 20, and one for 20 and higher.")
  values: T[];
  value: T;
}

@doc("Facets an int32 field by the specified value ranges.")
model Int32ValuesFacet extends NumericValuesFacet<int32> {
  @doc("The facet type.")
  kind: "Int32Values";
}

@route("/genericType")
@get
@convenientAPI(true)
op genericType(@body input: Int32ValuesFacet): void;
