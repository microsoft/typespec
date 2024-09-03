import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@doc("Test for mismatch of wire type and client type on class constructors.")
@service({
  title: "WireType",
})
namespace Cadl.WireType;

model SuperClassMismatch {
  @encode(DateTimeKnownEncoding.rfc7231, string)
  dateTimeRfc7231: utcDateTime;
}

model SuperClass {
  dateTime: utcDateTime;
}

model SubClass extends SuperClassMismatch {
  dateTime: utcDateTime;
}

model SubClassMismatch extends SuperClass {
  @encode(DateTimeKnownEncoding.rfc7231, string)
  dateTimeRfc7231: utcDateTime;
}

model SubClassBothMismatch extends SuperClassMismatch {
  @encode(BytesKnownEncoding.base64url, string)
  base64url: bytes;
}

@route("/wireType")
interface WireTypeOp {
  @route("/superClassMismatch")
  @put
  superClassMismatch(@body body: SubClass): SubClass;

  @route("/subClassMismatch")
  @put
  subClassMismatch(@body body: SubClassMismatch): SubClassMismatch;

  @route("/bothClassMismatch")
  @put
  bothClassMismatch(@body body: SubClassBothMismatch): SubClassBothMismatch;
}
