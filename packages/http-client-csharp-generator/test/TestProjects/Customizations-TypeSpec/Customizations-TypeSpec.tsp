import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";

@service({
    title: "Models in CADL",
    version: "0.1.0",
})
@doc("CADL project to test various types of models.")
namespace CustomizationsInTsp;

using TypeSpec.Http;
using TypeSpec.Rest;
using Azure.ClientGenerator.Core;
using Azure.Core;

@doc("Extensible enum to customize operator")
enum ExtensibleEnumWithOperator {
    @doc("Monday.")
    Monday,

    @doc("Tuesday.")
    Tuesday,
}

@doc("Model to add additional serializable property")
model ModelToAddAdditionalSerializableProperty extends ModelToRename {
    @doc("Required int")
    requiredInt: int32;
}

@doc("Public model made internal")
model ModelToMakeInternal {
    @doc("Required int")
    requiredInt: int32;
}

@doc("Renamed model (original name: ModelToRename)")
model ModelToRename {
    @doc("Required int")
    requiredIntOnBase: int32;

    @doc("Optional int")
    optionalInt?: int32;
}

@doc("Model to make to a struct")
model ModelStruct {
    @doc("Required int")
    requiredInt: int32;

    @doc("Optional int")
    optionalInt?: int32;

    @doc("Optional string")
    optionalString?: string;
}

@doc("Model moved into custom namespace")
model ModelToChangeNamespace {
    @doc("Required int")
    requiredInt: int32;
}

@doc("Model with customized properties")
model ModelWithCustomizedProperties {
    @doc("Public property made internal")
    propertyToMakeInternal: int32;

    @doc("Renamed property (original name: PropertyToRename)")
    propertyToRename: int32;

    @doc("Property with type changed to float (original type: int)")
    propertyToMakeFloat: int32;

    @doc("Property with type changed to int (original type: float)")
    propertyToMakeInt: float32;

    @doc("Property with type changed to duration (original type: string)")
    propertyToMakeDuration: string;

    @doc("Property with type changed to string (original type: duration)")
    propertyToMakeString: duration;

    @doc("Property with type changed to JsonElement (original type: string)")
    propertyToMakeJsonElement: string;

    @doc("Field that replaces property (original name: PropertyToField)")
    propertyToField: string;

    @doc("Property renamed that is list")
    badListName: string[];

    @doc("Property renamed that is dictionary")
    badDictionaryName: Record<string>;

    @doc("Property renamed that is listoflist")
    badListOfListName: string[][];

    @doc("Property renamed that is listofdictionary")
    badListOfDictionaryName: Record<string>[];

    @doc("Property type changed to ReadOnlyMemory<float>")
    vector: float32[];

    @doc("Property type changed to ReadOnlyMemory<float>?")
    vectorOptional?: float32[];

    @doc("Property type changed to ReadOnlyMemory<float>?")
    vectorNullable: float32[] | null;

    @doc("Property type changed to ReadOnlyMemory<float>?")
    vectorOptionalNullable?: float32[] | null;

    @doc("Property type changed to ReadOnlyMemory<float>")
    @visibility("read")
    vectorReadOnly: float32[];

    @doc("Property type changed to ReadOnlyMemory<float>?")
    @visibility("read")
    vectorOptionalReadOnly?: float32[];

    @doc("Property type changed to ReadOnlyMemory<float>?")
    @visibility("read")
    vectorNullableReadOnly: float32[] | null;

    @doc("Property type changed to ReadOnlyMemory<float>?")
    @visibility("read")
    vectorOptionalNullableReadOnly?: float32[] | null;
}

@doc("Renamed enum (original name: EnumToRename)")
@fixed
enum EnumToRename {
    One: "1",
    Two: "2",
    Three: "3",
}

@doc("Enum with renamed value (original name: ValueToRename)")
@fixed
enum EnumWithValueToRename {
    One: "1",
    Two: "2",
    ValueToRename: "3",
}

@doc("Extensible enum")
enum EnumToBeMadeExtensible {
    ExOne: "1",
    ExTwo: "2",
    ExThree: "3",
}

@doc("A normal enum")
enum NormalEnum {
    A: "a",
    B: "b",
}

@doc("Root RoundTrip model to reference all other types to ensure generation")
model RootModel {
    @doc("ExtensibleEnumWithOperator")
    propertyExtensibleEnum?: ExtensibleEnumWithOperator;

    @doc("ModelToMakeInternal")
    propertyModelToMakeInternal?: ModelToMakeInternal;

    @doc("ModelToRename")
    propertyModelToRename?: ModelToRename;

    @doc("ModelToChangeNamespace")
    propertyModelToChangeNamespace?: ModelToChangeNamespace;

    @doc("ModelWithCustomizedProperties")
    propertyModelWithCustomizedProperties?: ModelWithCustomizedProperties;

    @doc("EnumToRename")
    propertyEnumToRename?: EnumToRename;

    @doc("EnumWithValueToRename")
    propertyEnumWithValueToRename?: EnumWithValueToRename;

    @doc("EnumToBeMadeExtensible")
    propertyEnumToBeMadeExtensible?: EnumToBeMadeExtensible;

    @doc("ModelToAddAdditionalSerializableProperty")
    propertyModelToAddAdditionalSerializableProperty?: ModelToAddAdditionalSerializableProperty;

    @doc("Enum type property to move to customization code")
    propertyToMoveToCustomization?: NormalEnum;

    @doc("ModelStruct")
    propertyModelStruct?: ModelStruct;
}

@route("/inputToRoundTrip")
@doc("RoundTrip operation to make RootModel round-trip")
@get
@convenientAPI(true)
op roundTrip(@body input: RootModel): RootModel;

@route("/foo")
@doc("Sample operation with request body of a renamed model")
@get
@convenientAPI(true)
op foo(@body input: ModelToRename): ModelToRename;

@route("/bar")
@doc("Sample operation with request body using a model parameter with a spread operator.")
@get
@convenientAPI(true)
op bar(...ModelToRename): ModelToRename;
