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
    "{noTestTypeSpecUrl}",
    "Endpoint Service",
    {
        noTestTypeSpecUrl: string,
    }
)
@useAuth(
    ApiKeyAuth<ApiKeyLocation.header, "my-api-key">
)
namespace NoTestTypeSpec;

using TypeSpec.Http;
using Azure.ClientGenerator.Core;
using Azure.Core;

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

    @doc("optional nullable collection")
    optionalNullableList?: int32[] | null;

    @doc("required nullable collection")
    requiredNullableList: int32[] | null;
}

@route("/hello")
@doc("Return hi")
@get
op sayHi(
    @header headParameter: string,
    @query queryParameter: string,
    @query optionalQuery?: string
): Thing;
