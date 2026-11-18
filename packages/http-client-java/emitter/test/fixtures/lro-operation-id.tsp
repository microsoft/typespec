import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.Core;
using Azure.ClientGenerator.Core;

@service
@route("/lro")
namespace LroOperationIdTest;

model Result {
  value: string;
}

model PathStatus {
  status: Azure.Core.Foundations.OperationState;
  result?: Result;
}

@get
@route("/path/{resultId}")
op getPathStatus(@lroOperationId @path resultId: string): PathStatus;

@post
@route("/analyze")
@pollingOperation(getPathStatus)
op analyze(): Azure.Core.Foundations.AcceptedResponse &
  Azure.Core.Foundations.LongRunningStatusLocation<PathStatus>;

model CombinedStatus {
  @lroOperationId
  id: string;

  status: Azure.Core.Foundations.OperationState;
  result?: Result;
}

@get
@route("/combined/{operationId}")
op getCombinedStatus(@lroOperationId @path operationId: string): CombinedStatus;

@post
@route("/start")
@pollingOperation(getCombinedStatus)
op startTranslationWithPath(): Azure.Core.Foundations.AcceptedResponse &
  Azure.Core.Foundations.LongRunningStatusLocation<CombinedStatus>;

@get
@route("/body-only")
op getBodyOnlyStatus(): CombinedStatus;

@post
@route("/start-body-only")
@pollingOperation(getBodyOnlyStatus)
op startBodyOnly(): Azure.Core.Foundations.AcceptedResponse &
  Azure.Core.Foundations.LongRunningStatusLocation<CombinedStatus>;
