import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";

@service({
    title: "hello world",
    version: "0.1.0",
})
@doc("This is a sample typespec project.")
@server(
    "{firstTestTypeSpecUrl}",
    "Endpoint Service",
    {
        firstTestTypeSpecUrl: string,
    }
)
@useAuth(
    OAuth2Auth<[AuthFlow]> | ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key">
)
namespace NewProjectTypeSpec;

@doc("The auth flow model")
model AuthFlow {
    type: OAuth2FlowType.clientCredentials;
    tokenUrl: "https://api.example.com/oauth2/token";
    refreshUrl: "https://api.example.com/oauth2/refresh";
    scopes: ["https://api.example.com/.default"];
}

using TypeSpec.Http;
using Azure.ClientGenerator.Core;
using Azure.Core;

@doc("float fixed enum")
@fixed
enum FloatFixedEnum {
    One: 1.1,
    Two: 2.2,
    Four: 4.4,
}

@doc("int fixed enum")
@fixed
enum IntFixedEnum {
    One: 1,
    Two: 2,
    Four: 4,
}

@doc("Simple enum")
@fixed
enum StringFixedEnum {
    One: "1",
    Two: "2",
    Four: "4",
}

@doc("Int based extensible enum")
enum IntExtensibleEnum {
    One: 1,
    Two: 2,
    Four: 4,
}

@doc("Float based extensible enum")
enum FloatExtensibleEnum {
    One: 1.0,
    Two: 2.0,
    Four: 4.0,
}

@doc("Extensible enum")
enum StringExtensibleEnum {
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

    @doc("required literal int")
    requiredLiteralInt: 123;

    @doc("required literal float")
    requiredLiteralFloat: 1.23;

    @doc("required literal bool")
    requiredLiteralBool: false;

    @doc("optional literal string")
    optionalLiteralString?: "reject";

    @doc("optional literal int")
    optionalLiteralInt?: 456;

    @doc("optional literal float")
    optionalLiteralFloat?: 4.56;

    @doc("optional literal bool")
    optionalLiteralBool?: true;

    @doc("description with xml <|endoftext|>")
    requiredBadDescription: string;
}

@doc("this is not a friendly model but with a friendly name")
@friendlyName("Friend")
model NotFriend {
    @doc("name of the NotFriend")
    name: string;
}

@doc("this is a roundtrip model")
model RoundTripModel {
    @doc("Required string, illustrating a reference type property.")
    requiredString: string;

    @doc("Required int, illustrating a value type property.")
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

    @doc("this is a collection of float based extensible enum")
    floatExtensibleEnumCollection?: FloatExtensibleEnum[];

    @doc("this is a float based fixed enum")
    floatFixedEnum?: FloatFixedEnum;

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
    @visibility("read")
    readOnlyRequiredRecordUnknown: Record<unknown>;

    @doc("optional readonly record of unknown")
    @visibility("read")
    readOnlyOptionalRecordUnknown?: Record<unknown>;
}

enum DaysOfWeekExtensibleEnum {
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    Sunday,
}

model ModelWithFormat {
    @doc("url format")
    @format("Uri")
    sourceUrl: string;

    @doc("uuid format")
    @format("uuid")
    guid: string;
}

@doc("Hello world service")
@route("/hello")
namespace Hello.Demo {
    @doc("Return hi")
    @get
    op sayHi(
        @header headParameter: string,
        @query queryParameter: string,
        @query optionalQuery?: string
    ): Thing;
}

namespace Hello.Demo2 {
    @route("/againHi")
    @doc("Return hi again")
    @get
    @convenientAPI(true)
    op helloAgain(
        @header p1: string,
        @body action: RoundTripModel,
        @header contentType: "text/plain",
        @path p2: string
    ): RoundTripModel;

    @route("/noContentType")
    @doc("Return hi again")
    @get
    @convenientAPI(false)
    op noContentType(
        @header p1: string,
        @body action: RoundTripModel,
        @path p2: string
    ): RoundTripModel;

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
}

@route("/top")
@doc("top level method")
@get
@convenientAPI(true)
op topAction(@path @format("date") action: string): Thing;

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
op anonymousBody(...Thing): Thing;

@route("/friendlyName")
@doc("Model can have its friendly name")
@post
@convenientAPI(true)
op friendlyModel(...NotFriend): NotFriend;

op addTimeHeader(
    @header("Repeatability-First-Sent") repeatabilityFirstSent?: utcDateTime 
): void;

@route("/stringFormat")
@doc("paramete has string format.")
@post
@convenientAPI(true)
op stringFormat(@path @format("uuid") subscriptionId: string, @body body: ModelWithFormat): void;

namespace EnumTest {
    @get
    @route("/unknown-value")
    @doc("get extensible enum")
    op getUnknownValue(): DaysOfWeekExtensibleEnum;
}

namespace ProtocolAndConvenient {
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
}
