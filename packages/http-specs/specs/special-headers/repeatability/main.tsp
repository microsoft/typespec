import "@typespec/http";
import "@typespec/versioning";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using Spector;
using Versioning;
using Azure.ClientGenerator.Core;

@doc("Illustrates OASIS repeatability headers")
@scenarioService("/special-headers/repeatability")
namespace SpecialHeaders.Repeatability;

model RepeatableResponse {
  @doc("The status code.")
  @statusCode
  statusCode: 204;

  @visibility(Lifecycle.Read)
  @header("Repeatability-Result")
  // Go does not support the union-valued response header.
  @scope("!go")
  @doc("Indicates whether the repeatable request was accepted or rejected.")
  repeatabilityResult?: "accepted" | "rejected";
}

@scenario
@scenarioDoc("""
  Check we recognize Repeatability-Request-ID and Repeatability-First-Sent.
  """)
@doc("""
  Check we recognize Repeatability-Request-ID and Repeatability-First-Sent.
  """)
@post
@route("/immediateSuccess")
op immediateSuccess(
  @header("Repeatability-Request-ID")
  repeatabilityRequestID: string,

  @header("Repeatability-First-Sent")
  repeatabilityFirstSent: utcDateTime,
): RepeatableResponse;
