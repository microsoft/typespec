import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using Azure.ClientGenerator.Core;

@service(#{ title: "XmlBytesVerify" })
namespace TspTest.XmlBytesVerify;

@route("/xml-bytes")
@get
op getXmlBytes(): OkResponse & {
  @header("content-type") contentType: "application/xml";
  @body body: bytes;
};
