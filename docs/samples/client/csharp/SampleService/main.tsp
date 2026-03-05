import "@typespec/rest";
import "@typespec/http";
import "@typespec/xml";
import "@typespec/http-client-csharp";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";

@versioned(Versions)
@service(#{ title: "hello world" })
@doc("This is a sample typespec project.")
@server(
  "{sampleTypeSpecUrl}",
  "Endpoint Service",
  {
    sampleTypeSpecUrl: url,
  }
)
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "my-api-key"> | SampleOAuth2)
namespace SampleTypeSpec;

using TypeSpec.Http;
using TypeSpec.Versioning;
using TypeSpec.HttpClient.CSharp;
using TypeSpec.Xml;
using Azure.ClientGenerator.Core;

alias SampleOAuth2 = OAuth2Auth<[
  {
    type: OAuth2FlowType.implicit;
    authorizationUrl: "https://api.example.com/oauth2/authorize";
    refreshUrl: "https://api.example.com/oauth2/refresh";
    scopes: ["read"];
  }
]>;

enum Versions {
  `2024-07-16-preview`,
  `2024-08-16-preview`,
}

@doc("float fixed enum")
enum FloatFixedEnumWithIntValue {
  One: 1.0,
  Two: 2.0,
  Four: 4.0,
}

@doc("float fixed enum")
enum FloatFixedEnum {
  OneDotOne: 1.1,
  TwoDotTwo: 2.2,
  FourDotFour: 4.4,
}

@doc("int fixed enum")
enum IntFixedEnum {
  One: 1,
  Two: 2,
  Four: 4,
}

@doc("Simple enum")
enum StringFixedEnum {
  One: "1",
  Two: "2",
  Four: "4",
}

@doc("Int based extensible enum")
union IntExtensibleEnum {
  int32,
  One: 1,
  Two: 2,
  Four: 4,
}

@doc("Float based extensible enum")
union FloatExtensibleEnum {
  float32,
  OneDotOne: 1.1,
  TwoDotTwo: 2.2,
  FourDotFour: 4.4,
}

@doc("float fixed enum")
union FloatExtensibleEnumWithIntValue {
  float32,
  One: 1.0,
  Two: 2.0,
  Four: 4.0,
}

@doc("Extensible enum")
union StringExtensibleEnum {
  string,
  One: "1",
  Two: "2",
  Four: "4",
}

@doc("A model with a few properties of literal types")
model Thing {
  @doc("name of the Thing")
  name: string;

  @doc("required Union")
  requiredUnion: string | string[] | int32;

  @doc("required literal string")
  requiredLiteralString: "accept";

  @doc("required nullable string")
  requiredNullableString: string | null;

  @doc("required optional string")
  optionalNullableString?: string | null;

  @doc("required literal int")
  requiredLiteralInt: 123;

  @doc("required literal float")
  requiredLiteralFloat: 1.23;

  @doc("required literal bool")
  requiredLiteralBool: false;

  @doc("optional literal string")
  optionalLiteralString?: "reject";

  @doc("required nullable literal string")
  requiredNullableLiteralString: "someValue" | null;

  @doc("optional literal int")
  optionalLiteralInt?: 456;

  @doc("optional literal float")
  optionalLiteralFloat?: 4.56;

  @doc("optional literal bool")
  optionalLiteralBool?: true;

  @doc("description with xml <|endoftext|>")
  requiredBadDescription: string;

  @doc("optional nullable collection")
  optionalNullableList?: int32[] | null;

  @doc("required nullable collection")
  requiredNullableList: int32[] | null;

  /**
   * This tests:
   * - Simple bullet point. This bullet point is going to be very long to test how text wrapping is handled in bullet points within documentation comments. It should properly indent the wrapped lines.
   * - Another bullet point with **bold text**. This bullet point is also intentionally long to see how the formatting is preserved when the text wraps onto multiple lines in the generated documentation.
   * - Third bullet point with *italic text*. Similar to the previous points, this one is extended to ensure that the wrapping and formatting are correctly applied in the output.
   * - Complex bullet point with **bold** and *italic* combined. This bullet point combines both bold and italic formatting and is long enough to test the wrapping behavior in such cases.
   * - **Bold bullet point**: A bullet point that is entirely bolded. This point is also made lengthy to observe how the bold formatting is maintained across wrapped lines.
   * - *Italic bullet point*: A bullet point that is entirely italicized. This final point is extended to verify that italic formatting is correctly applied even when the text spans multiple lines.
   */
  propertyWithSpecialDocs: string;
}

@doc("A model with a few required nullable properties")
model ModelWithRequiredNullableProperties {
  @doc("required nullable primitive type")
  requiredNullablePrimitive: int32 | null;

  @doc("required nullable extensible enum type")
  requiredExtensibleEnum: StringExtensibleEnum | null;

  @doc("required nullable fixed enum type")
  requiredFixedEnum: StringFixedEnum | null;
}

@doc("this is not a friendly model but with a friendly name")
@friendlyName("Friend")
model NotFriend {
  @doc("name of the NotFriend")
  name: string;
}

@doc("this is a model with a client name")
@clientName("RenamedModel")
model ModelWithClientName {
  @doc("name of the ModelWithClientName")
  otherName: string;
}

model ModelWithEmbeddedNonBodyParameters {
  @doc("name of the ModelWithEmbeddedNonBodyParameters")
  name: string;

  @doc("required header parameter")
  @header
  requiredHeader: string;

  @doc("optional header parameter")
  @header
  optionalHeader?: string;

  @doc("required query parameter")
  @query
  requiredQuery: string;

  @doc("optional query parameter")
  @query
  optionalQuery?: string;
}

@doc("this is a roundtrip model")
model RoundTripModel {
  @doc("Required string, illustrating a reference type property.")
  requiredString: string;

  @doc("Required int, illustrating a value type property.")
  @encode(string)
  requiredInt: int32;

  @doc("Required collection of enums")
  requiredCollection: StringFixedEnum[];

  @doc("Required dictionary of enums")
  requiredDictionary: Record<StringExtensibleEnum>;

  @doc("Required model")
  requiredModel: Thing;

  @doc("this is an int based extensible enum")
  intExtensibleEnum?: IntExtensibleEnum;

  @doc("this is a collection of int based extensible enum")
  intExtensibleEnumCollection?: IntExtensibleEnum[];

  @doc("this is a float based extensible enum")
  floatExtensibleEnum?: FloatExtensibleEnum;

  @doc("this is a float based extensible enum")
  floatExtensibleEnumWithIntValue?: FloatExtensibleEnumWithIntValue;

  @doc("this is a collection of float based extensible enum")
  floatExtensibleEnumCollection?: FloatExtensibleEnum[];

  @doc("this is a float based fixed enum")
  floatFixedEnum?: FloatFixedEnum;

  @doc("this is a float based fixed enum")
  floatFixedEnumWithIntValue?: FloatFixedEnumWithIntValue;

  @doc("this is a collection of float based fixed enum")
  floatFixedEnumCollection?: FloatFixedEnum[];

  @doc("this is a int based fixed enum")
  intFixedEnum?: IntFixedEnum;

  @doc("this is a collection of int based fixed enum")
  intFixedEnumCollection?: IntFixedEnum[];

  @doc("this is a string based fixed enum")
  stringFixedEnum?: StringFixedEnum;

  @doc("required unknown")
  requiredUnknown: unknown;

  @doc("optional unknown")
  optionalUnknown?: unknown;

  @doc("required record of unknown")
  requiredRecordUnknown: Record<unknown>;

  @doc("optional record of unknown")
  optionalRecordUnknown?: Record<unknown>;

  @doc("required readonly record of unknown")
  @visibility(Lifecycle.Read)
  readOnlyRequiredRecordUnknown: Record<unknown>;

  @doc("optional readonly record of unknown")
  @visibility(Lifecycle.Read)
  readOnlyOptionalRecordUnknown?: Record<unknown>;

  @doc("this is a model with required nullable properties")
  modelWithRequiredNullable: ModelWithRequiredNullableProperties;

  @doc("Required bytes")
  requiredBytes: bytes;
}

@doc("A sample dynamic model.")
@dynamicModel
model DynamicModel {
  name: string;
  optionalUnknown?: unknown;
  optionalInt?: int32;
  optionalNullableList?: int32[] | null;
  requiredNullableList: int32[] | null;
  optionalNullableDictionary?: Record<int32> | null;
  requiredNullableDictionary: Record<int32> | null;
  primitiveDictionary: Record<int32>;
  foo: AnotherDynamicModel;
  listFoo: AnotherDynamicModel[];
  listOfListFoo: AnotherDynamicModel[][];
  dictionaryFoo: Record<AnotherDynamicModel>;
  dictionaryOfDictionaryFoo: Record<Record<AnotherDynamicModel>>;
  dictionaryListFoo: Record<AnotherDynamicModel[]>;
  listOfDictionaryFoo: Record<AnotherDynamicModel>[];
}

@doc("Another sample dynamic model.")
@dynamicModel
model AnotherDynamicModel {
  bar: string;
}

@nsDeclarations
enum XmlNamespaces {
  ns1: "https://example.com/ns1",
  ns2: "https://example.com/ns2",
}

@doc("An advanced XML model for testing various property types and XML features.")
@Xml.name("AdvancedXmlModel")
model XmlAdvancedModel {
  @doc("A simple string property")
  name: string;

  @doc("An integer property")
  age: int32;

  @doc("A boolean property")
  enabled: boolean;

  @doc("A float property")
  score: float32;

  @doc("An optional string")
  optionalString?: string;

  @doc("An optional integer")
  optionalInt?: int32;

  @doc("A nullable string")
  nullableString: string | null;

  @doc("A string as XML attribute")
  @attribute
  id: string;

  @doc("An integer as XML attribute")
  @attribute
  version: int32;

  @doc("A boolean as XML attribute")
  @attribute
  isActive: boolean;

  @doc("A property with a custom XML element name")
  @Xml.name("RenamedProperty")
  originalName: string;

  @doc("An attribute with a custom XML name")
  @attribute
  @Xml.name("xml-id")
  xmlIdentifier: string;

  @doc("Text content in the element (unwrapped string)")
  @unwrapped
  content: string;

  @doc("An unwrapped array of strings - items appear directly without wrapper")
  @unwrapped
  unwrappedStrings: string[];

  @doc("An unwrapped array of integers")
  @unwrapped
  unwrappedCounts: int32[];

  @doc("An unwrapped array of models")
  @unwrapped
  unwrappedItems: XmlItem[];

  @doc("A wrapped array of strings (default)")
  wrappedColors: string[];

  @doc("A wrapped array with custom wrapper name")
  @Xml.name("ItemCollection")
  items: XmlItem[];

  @doc("A nested model property")
  nestedModel: XmlNestedModel;

  @doc("An optional nested model")
  optionalNestedModel?: XmlNestedModel;

  @doc("A dictionary property")
  metadata: Record<string>;

  @doc("A date-time property")
  createdAt: utcDateTime;

  @doc("A duration property")
  duration: duration;

  @doc("A bytes property")
  data: bytes;

  @doc("optional record of unknown")
  optionalRecordUnknown?: Record<unknown>;

  @doc("A fixed enum property")
  fixedEnum: StringFixedEnum;

  @doc("An extensible enum property")
  extensibleEnum: StringExtensibleEnum;

  @doc("An optional fixed enum property")
  optionalFixedEnum?: IntFixedEnum;

  @doc("An optional extensible enum property")
  optionalExtensibleEnum?: IntExtensibleEnum;

  @attribute
  @ns(XmlNamespaces.ns1)
  label: string;

  @ns(XmlNamespaces.ns2)
  daysUsed: int32;

  @ns("http://www.contoso.com/anotherbook.dtd", "foo")
  fooItems: string[];

  @ns("http://www.contoso.com/anothermodel.dtd", "bar")
  anotherModel: XmlNestedModel;

  modelsWithNamespaces: XmlModelWithNamespace[];

  @unwrapped
  unwrappedModelsWithNamespaces: XmlModelWithNamespace[];

  listOfListFoo: XmlItem[][];
  dictionaryFoo: Record<XmlItem>;
  dictionaryOfDictionaryFoo: Record<Record<XmlItem>>;
  dictionaryListFoo: Record<XmlItem[]>;
  listOfDictionaryFoo: Record<XmlItem>[];
}

@doc("A nested model for XML testing")
model XmlNestedModel {
  @doc("The value of the nested model")
  value: string;

  @doc("An attribute on the nested model")
  @attribute
  nestedId: int32;
}

@doc("An item model for XML array testing")
@Xml.name("Item")
model XmlItem {
  @doc("The item name")
  itemName: string;

  @doc("The item value")
  itemValue: int32;

  @doc("Item ID as attribute")
  @attribute
  itemId: string;
}

@ns("http://www.example.com/namespace", "ns1")
model XmlModelWithNamespace {
  foo: string;
}

model Wrapper {
  @doc("header parameter")
  @header
  p1: string;

  @doc("body parameter")
  @body
  action: RoundTripModel;

  @doc("path parameter")
  @path
  p2: string;
}

union DaysOfWeekExtensibleEnum {
  string,
  Monday: "Monday",
  Tuesday: "Tuesday",
  Wednesday: "Wednesday",
  Thursday: "Thursday",
  Friday: "Friday",
  Saturday: "Saturday",
  Sunday: "Sunday",
}

@route("/hello")
@doc("Return hi")
@get
op sayHi(
  @header headParameter: string,
  @query queryParameter: string,
  @query optionalQuery?: string,
): Thing;

@route("/againHi")
@doc("Return hi again")
@get
@convenientAPI(true)
op helloAgain(
  @header p1: string,
  @body action: RoundTripModel,
  @header contentType: "text/plain",
  @path p2: string,
): RoundTripModel;

@route("/noContentType")
@doc("Return hi again")
@get
op noContentType(
  @header p1: string,
  @body action: RoundTripModel,
  @path p2: string,
): RoundTripModel;

op noContentTypeOverride(info: Wrapper): RoundTripModel;

@@override(noContentType, noContentTypeOverride);

@route("/demoHi")
@doc("Return hi in demo2")
@get
@convenientAPI(true)
op helloDemo2(): Thing;

@route("/literal")
@doc("Create with literal value")
@post
@convenientAPI(true)
op createLiteral(@body body: Thing): Thing;

@route("/helloLiteral")
@doc("Send literal parameters")
@get
@convenientAPI(true)
op helloLiteral(@header p1: "test", @path p2: 123, @query p3: true): Thing;

@route("/top")
@doc("top level method")
@get
@convenientAPI(true)
op topAction(@path action: utcDateTime): Thing;

@route("/top2")
@doc("top level method2")
@get
@convenientAPI(false)
op topAction2(): Thing;

@route("/patch")
@doc("top level patch")
@patch
@convenientAPI(true)
op patchAction(@body body: Thing): Thing;

@route("/anonymousBody")
@doc("body parameter without body decorator")
@post
@convenientAPI(true)
op anonymousBody(
  ...Thing,
  @query requiredQueryParam: "someRequiredLiteralQueryParam",
  @header requiredHeader: "someRequiredLiteralHeader",
): Thing;

@route("/friendlyName")
@doc("Model can have its friendly name")
@post
@convenientAPI(true)
op friendlyModel(...NotFriend): NotFriend;

op addTimeHeader(@header("Repeatability-First-Sent") repeatabilityFirstSent?: utcDateTime): void;

@route("/projectedName")
@doc("Model can have its projected name")
@post
@convenientAPI(true)
op projectedNameModel(...ModelWithClientName): ModelWithClientName;

@route("/returnsAnonymousModel")
@doc("return anonymous model")
@post
@convenientAPI(true)
op returnsAnonymousModel(): {
  @body body: {};
};

@get
@route("/unknown-value")
@doc("get extensible enum")
op getUnknownValue(): DaysOfWeekExtensibleEnum;

@doc("When set protocol false and convenient true, then the protocol method should be internal")
@route("internalProtocol")
@post
@convenientAPI(true)
@protocolAPI(false)
op internalProtocol(@body body: Thing): Thing;

@doc("When set protocol false and convenient true, the convenient method should be generated even it has the same signature as protocol one")
@route("stillConvenient")
@get
@convenientAPI(true)
@protocolAPI(false)
op stillConvenient(): void;

@route("/headAsBoolean")
@doc("head as boolean.")
@head
@convenientAPI(true)
op headAsBoolean(@path id: string): void;

@route("/WithApiVersion")
@doc("Return hi again")
@get
@convenientAPI(true)
op WithApiVersion(@header p1: string, @query apiVersion: string): void;

@route("/link")
@doc("List things with nextlink")
@convenientAPI(true)
@list
op ListWithNextLink(): {
  @pageItems
  things: Thing[];

  @nextLink next?: url;
};

@route("/linkString")
@doc("List things with nextlink")
@convenientAPI(true)
@list
op ListWithStringNextLink(): {
  @pageItems
  things: Thing[];

  @nextLink next?: string;
};

@route("/continuation")
@doc("List things with continuation token")
@convenientAPI(true)
@list
op ListWithContinuationToken(@query @continuationToken token?: string): {
  @pageItems
  things: Thing[];

  @continuationToken nextToken?: string;
};

@route("/continuation/header")
@doc("List things with continuation token header response")
@convenientAPI(true)
@list
op ListWithContinuationTokenHeaderResponse(@query @continuationToken token?: string): {
  @pageItems
  things: Thing[];

  @header @continuationToken nextToken?: string;
};

model Page<T> {
  @pageItems items: T[];
}

@route("list/paging")
@doc("List things with paging")
@convenientAPI(true)
@list
op ListWithPaging(): Page<Thing>;

@route("embeddedParameters")
@doc("An operation with embedded parameters within the body")
@post
op EmbeddedParameters(@bodyRoot body: ModelWithEmbeddedNonBodyParameters): void;

@route("dynamicModel")
@doc("An operation with a dynamic model")
@post
op DynamicModelOperation(@body body: DynamicModel): void;

@route("xmlAdvanced")
@doc("Get an advanced XML model with various property types")
@get
op GetXmlAdvancedModel(): {
  @header contentType: "application/xml";
  @body body: XmlAdvancedModel;
};

@route("xmlAdvanced")
@doc("Update an advanced XML model with various property types")
@put
op UpdateXmlAdvancedModel(@body body: XmlAdvancedModel, @header contentType: "application/xml"): {
  @header contentType: "application/xml";
  @body body: XmlAdvancedModel;
};

@doc("Base animal with discriminator")
@discriminator("kind")
model Animal {
  @doc("The kind of animal")
  kind: string;

  @doc("Name of the animal")
  name: string;
}

alias PetContent = {
  @doc("Whether the pet is trained")
  trained: boolean;
};

@doc("Pet is a discriminated animal")
model Pet extends Animal {
  kind: "pet";
  ...PetContent;
}

alias DogContent = {
  @doc("The breed of the dog")
  breed: string;
};

@doc("Dog is a specific type of pet with hierarchy building")
@Legacy.hierarchyBuilding(Pet)
model Dog extends Animal {
  kind: "dog";
  ...PetContent;
  ...DogContent;
}

@route("/animals")
interface AnimalOperations {
  @doc("Update a pet as an animal")
  @put
  @route("/pet/as-animal")
  updatePetAsAnimal(@body animal: Animal): Animal;

  @doc("Update a dog as an animal")
  @put
  @route("/dog/as-animal")
  updateDogAsAnimal(@body animal: Animal): Animal;
}

@route("/pets")
interface PetOperations {
  @doc("Update a pet as a pet")
  @put
  @route("/pet/as-pet")
  updatePetAsPet(@body pet: Pet): Pet;

  @doc("Update a dog as a pet")
  @put
  @route("/dog/as-pet")
  updateDogAsPet(@body pet: Pet): Pet;
}

@route("/dogs")
interface DogOperations {
  @doc("Update a dog as a dog")
  @put
  @route("/dog/as-dog")
  updateDogAsDog(@body dog: Dog): Dog;
}

@doc("Base plant with discriminator")
@discriminator("species")
model Plant {
  @doc("The species of plant")
  species: string;

  @doc("The unique identifier of the plant")
  id: string;

  @doc("The height of the plant in centimeters")
  height: int32;
}

@doc("Tree is a specific type of plant")
model Tree extends Plant {
  species: "tree";

  @doc("The age of the tree in years")
  age: int32;
}

@route("/plants")
interface PlantOperations {
  @doc("Get a tree as a plant")
  @get
  @route("/tree/as-plant")
  getTree(): {
    @header contentType: "application/xml";
    @body body: Tree;
  };

  @doc("Get a tree as a plant")
  @get
  @route("/tree/as-plant/json")
  getTreeAsJson(): {
    @header contentType: "application/json";
    @body body: Tree;
  };

  @doc("Update a tree as a plant")
  @put
  @route("/tree/as-plant")
  updateTree(@body tree: Tree, @header contentType: "application/xml"): {
    @header contentType: "application/xml";
    @body body: Tree;
  };

  @doc("Update a tree as a plant")
  @put
  @route("/tree/as-plant/json")
  updateTreeAsJson(@body tree: Tree, @header contentType: "application/json"): {
    @header contentType: "application/json";
    @body body: Tree;
  };
}

@clientInitialization({
  initializedBy: InitializedBy.individually | InitializedBy.parent,
})
interface Metrics {
  @doc("Get Widget metrics for given day of week")
  @get
  @route("/metrics/widgets/daysOfWeek")
  getWidgetMetrics(@path day: DaysOfWeekExtensibleEnum): {
    numSold: int32;
    averagePrice: float32;
  };
}
