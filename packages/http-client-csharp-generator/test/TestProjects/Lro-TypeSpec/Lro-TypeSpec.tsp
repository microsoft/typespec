import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";
import "@typespec/versioning";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;
using Azure.Core;
using TypeSpec.Versioning;
using TypeSpec.Rest;
using Azure.Core.Traits;

@service({
    title: "hello world",
    version: "0.1.0",
})
@doc("This is a sample typespec lro project.")
@server(
    "{lroEndpoint}",
    "Endpoint Service",
    {
        lroEndpoint: string,
    }
)
@useAuth(
    OAuth2Auth<[AuthFlow]> | ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key">
)
@useDependency(Azure.Core.Versions.v1_0_Preview_1)
namespace lro;

@doc("The auth flow model")
model AuthFlow {
    type: OAuth2FlowType.clientCredentials;
    tokenUrl: "https://api.example.com/oauth2/token";
    refreshUrl: "https://api.example.com/oauth2/refresh";
    scopes: ["https://api.example.com/.default"];
}

#suppress "@azure-tools/typespec-azure-core/documentation-required" "MUST fix in next version"
@doc("The status of the processing job.")
@lroStatus
enum JobStatus {
  NotStarted: "notStarted",
  Running: "running",
  Succeeded: "succeeded",
  Failed: "failed",
  Canceled: "canceled",
}

@doc("Provides status details for long running operations.")
model HealthInsightsOperationStatus<
  TStatusResult = never,
  TStatusError = Foundations.Error
> {
  @key("operationId")
  @doc("The unique ID of the operation.")
  @visibility("read")
  id: Azure.Core.uuid;

  @doc("The status of the operation")
  @visibility("read")
  @lroStatus
  status: JobStatus;

  @doc("The date and time when the processing job was created.")
  @visibility("read")
  createdDateTime?: utcDateTime;

  @doc("The date and time when the processing job is set to expire.")
  @visibility("read")
  expirationDateTime?: utcDateTime;

  @doc("The date and time when the processing job was last updated.")
  @visibility("read")
  lastUpdateDateTime?: utcDateTime;

  @doc("Error object that describes the error when status is \"Failed\".")
  error?: TStatusError;

  @doc("The result of the operation.")
  @lroResult
  result?: TStatusResult;
}

@doc("The location of an instance of {name}", TResource)
scalar HealthInsightsResourceLocation<TResource extends {}> extends url;

@doc("Metadata for long running operation status monitor locations")
model HealthInsightsLongRunningStatusLocation<TStatusResult = never> {
  @pollingLocation
  @doc("The location for monitoring the operation state.")
  @TypeSpec.Http.header("Operation-Location")
  operationLocation: HealthInsightsResourceLocation<HealthInsightsOperationStatus<TStatusResult>>;
}
#suppress "@azure-tools/typespec-azure-core/long-running-polling-operation-required" "This is a template"
@doc("Long running RPC operation template")
op HealthInsightsLongRunningRpcOperation<
  TParams extends TypeSpec.Reflection.Model,
  TResponse extends TypeSpec.Reflection.Model,
  Traits extends object = {}
> is Azure.Core.RpcOperation<
  TParams & RepeatabilityRequestHeaders,
  Foundations.AcceptedResponse<HealthInsightsLongRunningStatusLocation<TResponse> &
    Foundations.RetryAfterHeader> &
    RepeatabilityResponseHeaders &
    HealthInsightsOperationStatus,
  Traits
>;
@trait("HealthInsightsRetryAfterTrait")
@doc("Health Insights retry after trait")
model HealthInsightsRetryAfterTrait {
  #suppress "@azure-tools/typespec-providerhub/no-inline-model" "This inline model is never used directly in operations."
  @doc("The retry-after header.")
  retryAfter: {
    @traitLocation(TraitLocation.Response)
    response: Foundations.RetryAfterHeader;
  };
}

@doc("The inference results for the Radiology Insights request.")
model RadiologyInsightsInferenceResult {
    id: string;
}
alias Request = {
    @doc("The list of patients, including their clinical information and data.")
    patients: string[];
  };
@resource("radiology-insights/jobs")
@doc("The response for the Radiology Insights request.")
model RadiologyInsightsResult
  is HealthInsightsOperationStatus<RadiologyInsightsInferenceResult>;

  @doc("The body of the Radiology Insights request.")
  model RadiologyInsightsData {
    ...Request;
  
    @doc("Configuration affecting the Radiology Insights model's inference.")
    configuration?: string;
  }

#suppress "@azure-tools/typespec-azure-core/long-running-polling-operation-required" "This is a template"
@doc("Long running Pool operation template")
op HealthInsightsLongRunningPollOperation<TResult extends TypeSpec.Reflection.Model> is Azure.Core.RpcOperation<
  {
    @doc("A processing job identifier.")
    @path("id")
    id: Azure.Core.uuid;
  },
  TResult,
  HealthInsightsRetryAfterTrait
>;

interface LegacyLro {
    #suppress "@azure-tools/typespec-azure-core/no-rpc-path-params" "Service uses a jobId in the path"
    @summary("Get Radiology Insights job details")
    @tag("RadiologyInsights")
    @doc("Gets the status and details of the Radiology Insights job.")
    @get
    @route("/radiology-insights/jobs/{id}")
    getJob is HealthInsightsLongRunningPollOperation<RadiologyInsightsResult>;
  
    #suppress "@azure-tools/typespec-azure-core/long-running-polling-operation-required" "Polling through operation-location"
    #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "There is no long-running RPC template in Azure.Core"
    @summary("Create Radiology Insights job")
    @tag("RadiologyInsights")
    @doc("Creates a Radiology Insights job with the given request body.")
    @pollingOperation(LegacyLro.getJob)
    @route("/radiology-insights/jobs")
    @convenientAPI(true)
    createJob is HealthInsightsLongRunningRpcOperation<
      RadiologyInsightsData,
      RadiologyInsightsResult
    >;
  }
