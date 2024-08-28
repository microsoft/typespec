import "@typespec/rest";
import "@azure-tools/typespec-azure-core";

using TypeSpec.Http;
using TypeSpec.Versioning;
using Azure.Core.Foundations;

@service({
  title: "ErrorModel",
})
@useDependency(Azure.Core.Versions.v1_0_Preview_2)
namespace Cadl.ErrorModel;

model Diagnostic {
  name: string;
  error: Error;
}

@route("/error")
interface ErrorOp {
  read(): ResourceCreatedOrOkResponse<Diagnostic> | ErrorResponse;
}
