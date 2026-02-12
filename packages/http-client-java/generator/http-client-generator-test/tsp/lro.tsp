import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Rest;
using TypeSpec.Http;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.Core.Traits;
using Azure.ClientGenerator.Core;

@service(#{ title: "LongRunning" })
@versioned(ApiVersions)
@route("/long-running")
namespace TspTest.LongRunning {
  enum ApiVersions {
    v2022_06_01_preview: "2022-06-01-preview",
  }

  // case of LRO having pollingOperation in non-service namespace
  @pollingOperation(NonService.poll)
  @post
  @route("/post")
  op longRunning(): AcceptedResponse;

  model PollResponse {
    operationId: string;
    status: Azure.Core.Foundations.OperationState;
  }

  // case of HealthInsights
  @route("/jobs/{id}")
  op getJob is LroLongRunningPollOperation<JobResult>;

  @pollingOperation(LongRunning.getJob)
  @route("/jobs")
  op createJob is LroLongRunningRpcOperation<
    {
      @body body: JobData;
    },
    JobResult
  >;

  model JobData {
    configuration?: string;
    nullableFloatDict: Record<float64 | null>;
  }

  model JobResult
    is LroOperationStatus<{
      data: string;
    }>;

  @lroStatus
  union JobStatus {
    string,
    NotStarted: "notStarted",
    Running: "running",
    Succeeded: "Succeeded",
    Failed: "Failed",
    Canceled: "canceled",
  }

  model LroOperationStatus<TStatusResult = never, TStatusError = Foundations.Error> {
    @key("operationId")
    @visibility(Lifecycle.Read)
    id: Azure.Core.uuid;

    @visibility(Lifecycle.Read)
    @lroStatus
    status: JobStatus;

    @visibility(Lifecycle.Read)
    createdDateTime?: utcDateTime;

    @visibility(Lifecycle.Read)
    expirationDateTime?: utcDateTime;

    @visibility(Lifecycle.Read)
    lastUpdateDateTime?: utcDateTime;

    error?: TStatusError;
    result?: TStatusResult;
  }

  op LroLongRunningRpcOperation<
    TParams extends TypeSpec.Reflection.Model,
    TResponse extends TypeSpec.Reflection.Model,
    Traits extends {} = {}
  > is Azure.Core.RpcOperation<
    TParams & RepeatabilityRequestHeaders,
    Foundations.AcceptedResponse<LroLongRunningStatusLocation<TResponse> &
      Foundations.RetryAfterHeader> &
      RepeatabilityResponseHeaders &
      LroOperationStatus,
    Traits
  >;

  op LroLongRunningPollOperation<TResult extends TypeSpec.Reflection.Model> is Azure.Core.RpcOperation<
    {
      @path("id")
      id: Azure.Core.uuid;
    },
    TResult,
    LroRetryAfterTrait
  >;

  model LroLongRunningStatusLocation<TStatusResult = never> {
    @pollingLocation
    @TypeSpec.Http.header("Operation-Location")
    operationLocation: LroResourceLocation<LroOperationStatus<TStatusResult>>;
  }

  scalar LroResourceLocation<TResource extends {}> extends url;

  @trait("LroRetryAfterTrait")
  model LroRetryAfterTrait {
    retryAfter: {
      @traitLocation(TraitLocation.Response)
      response: Foundations.RetryAfterHeader;
    };
  }
}

namespace TspTest.NonService {
  @route("/poll")
  @get
  op poll(): TspTest.LongRunning.PollResponse;
}
