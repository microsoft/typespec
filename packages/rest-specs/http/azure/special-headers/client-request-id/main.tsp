import "@typespec/http";
import "@azure-tools/cadl-ranch-expect";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@doc("Azure client request id header configurations.")
@supportedBy("dpg")
@scenarioService("/azure/special-headers/x-ms-client-request-id")
@scenario
@scenarioDoc("""
  Test case for azure client request id header. SDK should not generate `clientRequestId` paramerter but use policy to auto-set the header.
  Expected header parameters:
  - x-ms-client-request-id=<any uuid string>
  Expected response header:
  - x-ms-client-request-id=<uuid string same with request header>
  """)
namespace Azure.SpecialHeaders.XmsClientRequestId;

@doc("""
  Get operation with azure `x-ms-client-request-id` header.
  """)
@get
@route("/")
op get(
  @header("x-ms-client-request-id")
  clientRequestId?: string,
): NoContentResponse;
