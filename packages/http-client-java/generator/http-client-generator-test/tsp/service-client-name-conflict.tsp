import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;

@service(#{ title: "ServiceClientNameConflict" })
namespace TspTest.ServiceClientNameConflict;

@route("/ping")
@get
op ping(): string;

interface Service {
  @route("/status")
  @get
  getStatus(): string;
}
