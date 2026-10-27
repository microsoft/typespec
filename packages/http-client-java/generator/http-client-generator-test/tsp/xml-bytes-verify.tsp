import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using Azure.ClientGenerator.Core;

@service(#{ title: "XmlBytesVerify" })
namespace TspTest.XmlBytesVerify;

// Operation that returns a raw XML document as bytes (like planetarycomputer getWmtsCapabilities).
// The response content-type is application/xml but the body is unstructured bytes, so NO XML
// ObjectSerializer (SERIALIZER) should be generated/used.
@route("/xml-bytes")
@get
op getWmtsCapabilities(): OkResponse & {
  @header("content-type") contentType: "application/xml";
  @body body: bytes;
};
