import "@typespec/http";
import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using Azure.Core;
using Azure.ClientGenerator.Core;

@service
namespace LroFixture;

model Statistics {
  completed: int32;
}

model BaseMonitor {
  @lroStatusMetadata
  @clientName("updatedAt")
  @encodedName("application/json", "last_updated")
  updated?: utcDateTime;
}

model Monitor extends BaseMonitor {
  @lroStatus
  status: "Running" | "Succeeded" | "Failed" | "Canceled";

  @lroResult
  result?: string;

  @lroOperationId
  @clientName("jobId")
  @encodedName("application/json", "job_id")
  id: string;

  @lroStatusMetadata
  @clientName("progress")
  @encodedName("application/json", "percent_complete")
  percent?: int32;

  @lroStatusMetadata
  statistics?: Statistics;
}

@get
@route("/jobs/{jobId}/status")
op getStatus(@lroOperationId @path("jobId") id: string): Monitor;

@post
@route("/jobs")
@pollingOperation(getStatus)
op begin(): {
  @statusCode code: 202;
  @pollingLocation @header("Operation-Location") location: ResourceLocation<Monitor>;
};
