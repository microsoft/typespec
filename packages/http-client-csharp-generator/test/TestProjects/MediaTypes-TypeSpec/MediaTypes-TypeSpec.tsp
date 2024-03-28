import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service(
    {
        title: "Media Types Service",
        version: "2021-03-25"
    }
)
@doc("Play with produces/consumes and media-types in general.")
@server(
    "{endpoint}",
    "Endpoint Service",
    {
        endpoint: string,
    }
)
namespace MultipleMediaTypes;

model Body {
    id: string;
}

@route("/oneBinaryBodyTwoContentTypes")
@convenientAPI(true)
op oneBinaryBodyTwoContentTypes(@body body: bytes, @header contentType: "application/json; serialization=Avro" | "application/octet-stream"): void;

@route("/oneStringBodyThreeContentTypes")
@convenientAPI(true)
op oneStringBodyThreeContentTypes(@body body: string, @header contentType: "application/json" | "application/octet-stream" | "text/plain"): void;

@route("/oneModelBodyOneContentType")
@convenientAPI(true)
op oneModelBodyOneContentType(@body body: Body, @header contentType: "application/json"): void;
