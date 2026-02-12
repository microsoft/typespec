import "@typespec/rest";
import "@azure-tools/typespec-azure-core";

using TypeSpec.Http;
using TypeSpec.Versioning;
using Azure.Core.Foundations;

@service(#{ title: "ErrorModel" })
namespace TspTest.ErrorModel;

model Diagnostic {
  name: string;
  error: Error;
  subError: SubError;
}

model SubError extends Error {
  subCode: string;
}

// BatchError, BatchErrorException is generated, on use-default-http-status-code-to-exception-type-mapping=false
@error
model BatchError {
  code?: string;
  message?: BatchErrorMessage;
}

model BatchErrorMessage {
  lang?: string;
  value?: string;
}

// BadResponseError, BadResponseErrorException is generated, on use-default-http-status-code-to-exception-type-mapping=false
@error
model BadResponseError is Response<400> {
  code: string;
  data: Details;
}

model Details {
  name: string;
}

@error
model NotFoundErrorResponse is NotFoundResponse;

@route("/error")
interface ErrorOp {
  read():
    | ResourceCreatedOrOkResponse<Diagnostic>
    | NotFoundErrorResponse
    | BadResponseError
    | BatchError;
}
