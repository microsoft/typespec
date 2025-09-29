import "@typespec/http";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";
import "@typespec/rest";
import "./models.tsp";

using TypeSpec.Http;
using Azure.Core;
using Azure.ClientGenerator.Core;

namespace Azure.Batch;

// Batch operation definitions
#suppress "@azure-tools/typespec-azure-core/no-response-body" "Legacy behavior"
@get
@list
op ListOperation<
  TFilter extends TypeSpec.Reflection.Model,
  TResponse
> is Azure.Core.RpcOperation<
  TFilter,
  BatchResponseHeaders & TResponse,
  NoFilter,
  BatchError
>;

#suppress "@azure-tools/typespec-azure-core/no-response-body" "Legacy behavior"
@get
op ReadOperation<
  TPathParams extends TypeSpec.Reflection.Model,
  TResource
> is Azure.Core.RpcOperation<
  TPathParams,
  TResource & BatchResponseHeaders,
  NoFilter,
  BatchError
>;

#suppress "@azure-tools/typespec-azure-core/no-response-body" "Legacy behavior"
@get
op FileOperation<
  TPathParams extends TypeSpec.Reflection.Model,
  TResource
> is Azure.Core.RpcOperation<
  TPathParams,
  TResource & FileResponseHeaders,
  NoFilter,
  BatchError
>;

#suppress "@azure-tools/typespec-azure-core/no-response-body" "Legacy behavior"
@head
op HeadFileOperation<
  TPathParams extends TypeSpec.Reflection.Model,
  TResource
> is Azure.Core.RpcOperation<
  TPathParams,
  TResource & FileResponseHeaders,
  NoFilter,
  BatchError
>;

#suppress "@azure-tools/typespec-azure-core/no-response-body" "Legacy behavior"
@delete
op DeleteOperation<
  TFilter extends TypeSpec.Reflection.Model,
  TResponse extends TypeSpec.Reflection.Model
> is Azure.Core.RpcOperation<TFilter, TResponse, NoFilter, BatchError>;

#suppress "@azure-tools/typespec-azure-core/no-response-body" "Legacy behavior"
@post
op CreateOperation<
  TResource extends TypeSpec.Reflection.Model,
  TResponse
> is RpcOperation<
  TResource,
  Created<TResponse> & BatchResponseHeaders,
  NoFilter,
  BatchError
>;

#suppress "@azure-tools/typespec-azure-core/no-response-body" "Legacy behavior"
@patch(#{ implicitOptionality: true })
op UpdateOperation<
  TResource extends TypeSpec.Reflection.Model,
  TResponse
> is RpcOperation<
  TResource,
  TResponse & BatchResponseHeaders,
  NoFilter,
  BatchError
>;

#suppress "@azure-tools/typespec-azure-core/no-response-body" "Legacy behavior"
@put
op ReplaceOperation<
  TResource extends TypeSpec.Reflection.Model,
  TResponse
> is RpcOperation<
  TResource,
  TResponse & BatchResponseHeaders,
  NoFilter,
  BatchError
>;

#suppress "@azure-tools/typespec-azure-core/no-error-status-codes" "Azure REST API guidelines recommend using 'default' error response for all error cases. Avoid defining custom 4xx or 5xx error cases."
#suppress "@azure-tools/typespec-azure-core/no-response-body" "Legacy behavior"
@doc("New rpc operation allowing multiple responses")
@head
op ResourceInfoOperationWithAdditionalResponse<
  TParams extends TypeSpec.Reflection.Model,
  TResponse extends TypeSpec.Reflection.Model,
  TAdditionalResponse extends {} = {}
> is Foundations.Operation<
  TParams,
  TResponse | TAdditionalResponse,
  NoFilter,
  BatchError
>;

#suppress "@azure-tools/typespec-azure-core/no-response-body" "Legacy behavior"
@post
op PostOperation<
  TResource extends TypeSpec.Reflection.Model,
  TResponse
> is RpcOperation<
  TResource,
  TResponse & BatchResponseHeaders,
  NoFilter,
  BatchError
>;

// Templates
alias NoFilter = {};
alias MinimalMetadata = {
  @doc("Type of content")
  @header("content-type")
  contentType: "application/json; odata=minimalmetadata";
};

alias Created<T> = {
  @doc("A process exit code.")
  @statusCode
  code: "201";

  @header("DataServiceId")
  @doc("The OData ID of the resource to which the request applied.")
  dataServiceId: string;
};

alias CommonJsonParameters = {
  ...CommonParameters;
  ...MinimalMetadata;
};

// headers ////////////////////

alias AcceptedProcessingResponseHeaders = {
  @doc("A process exit code.")
  @statusCode
  code: "202";

  ...DataServiceResponseHeaders;
};

alias NoContentSuccessResponseHeaders = {
  @doc("A process exit code.")
  @statusCode
  code: "204";

  ...DataServiceResponseHeaders;
};

alias RequestSuccessResponseHeaders = {
  @doc("A process exit code.")
  @statusCode
  code: "200";

  ...DataServiceResponseHeaders;
};

alias DataServiceResponseHeaders = {
  @header("DataServiceId")
  @doc("The OData ID of the resource to which the request applied.")
  dataServiceId: string;
};

alias FileResponseHeaders = {
  @doc("A process exit code.")
  @statusCode
  code: "200";

  @header("Content-Length")
  @doc("The length of the file.")
  @encode(string)
  contentLength: int64;

  ...BatchEtagResponseHeaders;

  @doc("The client-request-id provided by the client during the request. This will be returned only if the return-client-request-id parameter was set to true.")
  @header("client-request-id")
  clientRequestId?: string;

  @header("ocp-batch-file-isdirectory")
  @doc("Whether the object represents a directory.")
  ocpbatchfileisdirectory: boolean;

  @header("ocp-batch-file-mode")
  @doc("The file mode attribute in octal format.")
  ocpbatchfilemode: string;

  @header("ocp-batch-file-url")
  @doc("The URL of the file.")
  ocpbatchfileurl: string;

  @header("ocp-creation-time")
  @doc("The file creation time.")
  @encode(DateTimeKnownEncoding.rfc7231)
  ocpcreationtime?: utcDateTime;

  @doc("A unique identifier for the request that was made to the Batch service. If a request is consistently failing and you have verified that the request is properly formulated, you may use this value to report the error to Microsoft. In your report, include the value of this request ID, the approximate time that the request was made, the Batch Account against which the request was made, and the region that Account resides in.")
  @header("request-id")
  requestid?: string;
};

alias BatchPoolHeaders = {
  ...BatchMatchHeaders;

  @doc("The ID of the Pool to get.")
  @path
  poolId: string;
};

alias BatchMatchHeaders = {
  ...BatchModifiedSinceHeaders;

  @doc("""
    An ETag value associated with the version of the resource known to the client.
    The operation will be performed only if the resource's current ETag on the
    service exactly matches the value specified by the client.
    """)
  @header("If-Match")
  @clientName("if__match", "python")
  ifMatch?: string;

  @doc("""
    An ETag value associated with the version of the resource known to the client.
    The operation will be performed only if the resource's current ETag on the
    service does not match the value specified by the client.
    """)
  @header("If-None-Match")
  @clientName("if_none_match", "python")
  ifNoneMatch?: string;
};

alias BatchModifiedSinceHeaders = {
  @doc("""
    A timestamp indicating the last modified time of the resource known to the
    client. The operation will be performed only if the resource on the service has
    been modified since the specified time.
    """)
  @header("If-Modified-Since")
  @encode(DateTimeKnownEncoding.rfc7231)
  @clientName("if_modified_since", "python")
  ifModifiedSince?: utcDateTime;

  @doc("""
    A timestamp indicating the last modified time of the resource known to the
    client. The operation will be performed only if the resource on the service has
    not been modified since the specified time.
    """)
  @header("If-Unmodified-Since")
  @encode(DateTimeKnownEncoding.rfc7231)
  @clientName("if_unmodified_since", "python")
  ifUnmodifiedSince?: utcDateTime;
};

// This is the standard set of headers that most of batch apis return
alias BatchResponseHeaders = BatchEtagResponseHeaders &
  BatchClientResponseHeaders;

alias BatchEtagResponseHeaders = {
  @doc("The ETag HTTP response header. This is an opaque string. You can use it to detect whether the resource has changed between requests. In particular, you can pass the ETag to one of the If-Modified-Since, If-Unmodified-Since, If-Match or If-None-Match headers.")
  @header("ETag")
  @clientName("etag", "python")
  etag?: string;

  @doc("The time at which the resource was last modified.")
  @header("Last-Modified")
  @encode(DateTimeKnownEncoding.rfc7231)
  lastmodified?: utcDateTime;
};

alias BatchClientResponseHeaders = {
  @doc("The client-request-id provided by the client during the request. This will be returned only if the return-client-request-id parameter was set to true.")
  @header("client-request-id")
  clientRequestId?: string;

  @doc("A unique identifier for the request that was made to the Batch service. If a request is consistently failing and you have verified that the request is properly formulated, you may use this value to report the error to Microsoft. In your report, include the value of this request ID, the approximate time that the request was made, the Batch Account against which the request was made, and the region that Account resides in.")
  @header("request-id")
  requestid?: string;
};

alias PoolDoesExistResponseHeaders = {
  ...BatchResponseHeaders;

  @doc("A process exit code.")
  @statusCode
  code: "200";
};

alias PoolDoesNotExistResponseHeaders = {
  @doc("A process exit code.")
  @statusCode
  code: "404";
};

alias JobScheduleDoesExistResponseHeaders = {
  ...BatchResponseHeaders;

  @doc("A response containing headers related to the Job Schedule, if it exists.")
  @statusCode
  code: "200";
};

alias JobScheduleDoesNotExistResponseHeaders = {
  @doc("The Job Schedule does not exist.")
  @statusCode
  code: "404";
};

alias DeleteResponseHeaders = {
  @doc("A process exit code.")
  @statusCode
  code: "202";

  @doc("The client-request-id provided by the client during the request. This will be returned only if the return-client-request-id parameter was set to true.")
  @header("client-request-id")
  clientRequestId?: string;

  @doc("A unique identifier for the request that was made to the Batch service. If a request is consistently failing and you have verified that the request is properly formulated, you may use this value to report the error to Microsoft. In your report, include the value of this request ID, the approximate time that the request was made, the Batch Account against which the request was made, and the region that Account resides in.")
  @header("request-id")
  requestid?: string;
};

alias CommonListParameters = {
  ...CommonParameters;

  @doc("""
    The maximum number of items to return in the response. A maximum of 1000
    applications can be returned.
    """)
  @query
  @minValue(1)
  @maxValue(1000)
  @clientName("maxPageSize", "java")
  @clientName("max_results", "python")
  maxresults?: int32 = 1000;
};

alias BatchNodeFileClientPathContent = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the Compute Node.")
  @path
  nodeId: string;

  @doc("The path to the file or directory.")
  @path
  filePath: string;
};

alias BatchTaskFileClientPathContent = {
  @doc("The ID of the Job that contains the Task.")
  @path
  jobId: string;

  @doc("The ID of the Task whose file you want to retrieve.")
  @path
  taskId: string;

  @doc("The path to the Task file that you want to get the content of.")
  @path
  filePath: string;
};

alias CommonParameters = {
  @doc("""
    The maximum time that the server can spend processing the request, in seconds. The default is 30 seconds. If the value is larger than 30, the default will be used instead.".
    """)
  @query
  @clientName("timeOutInSeconds", "java")
  @clientName("timeOutInSeconds", "csharp")
  @clientName("timeOutInSeconds", "javascript")
  @clientName("timeout", "go,python")
  @encode("seconds", int32)
  timeOut?: duration;

  @doc("""
    The caller-generated request identity, in the form of a GUID with no decoration
    such as curly braces, e.g. 9C4D50EE-2D56-4CD3-8152-34347DC9F2B0.
    """)
  @header("client-request-id")
  clientRequestId?: string;

  @doc("Whether the server should return the client-request-id in the response.")
  @header("return-client-request-id")
  returnClientRequestId?: boolean = false;

  @doc("""
    The time the request was issued. Client libraries typically set this to the
    current system clock time; set it explicitly if you are calling the REST API
    directly.
    """)
  @header("ocp-date")
  @encode(DateTimeKnownEncoding.rfc7231)
  @clientName("ocpDate", "csharp")
  ocpdate?: utcDateTime;
};

// Parameters and Responses

// Application Aliases
alias GetApplicationRequiredParameters = {
  @doc("The ID of the Application")
  @path
  applicationId: string;
};

// Pool Aliases
alias ListPoolUsageMetricsOptionalParameters = {
  @doc("""
    The earliest time from which to include metrics. This must be at least two and
    a half hours before the current time. If not specified this defaults to the
    start time of the last aggregation interval currently available.
    """)
  @query
  @clientName("starttime", "csharp,python,javascript,go")
  startTime?: utcDateTime;

  @doc("""
    The latest time from which to include metrics. This must be at least two hours
    before the current time. If not specified this defaults to the end time of the
    last aggregation interval currently available.
    """)
  @query
  endtime?: utcDateTime;

  @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://learn.microsoft.com/rest/api/batchservice/odata-filters-in-batch#list-account-usage-metrics.
    """)
  @query
  @clientName("filter", "!autorest")
  $filter?: string;
};

alias CreatePoolRequiredParameters = {
  @body
  @doc("The Pool to be created.")
  pool: BatchPoolCreateOptions;
};

alias ListPoolsOptionalParameters = {
  @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://learn.microsoft.com/rest/api/batchservice/odata-filters-in-batch#list-pools.
    """)
  @query
  @clientName("filter", "!autorest")
  $filter?: string;

  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];

  @doc("An OData $expand clause.")
  @query
  @clientName("expand", "!autorest")
  $expand?: string[];
};

alias DisablePoolAutoscaleRequiredParameters = {
  @doc("The ID of the Pool on which to disable automatic scaling.")
  @path
  poolId: string;
};

alias ListSupportedImagesOptionalParameters = {
  @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://learn.microsoft.com/rest/api/batchservice/odata-filters-in-batch#list-support-images.
    """)
  @query
  @clientName("filter", "!autorest")
  $filter?: string;
};

alias ListPoolNodeCountsOptionalParameters = {
  @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://learn.microsoft.com/rest/api/batchservice/odata-filters-in-batch#list-support-images.
    """)
  @query
  @clientName("filter", "!autorest")
  $filter?: string;
};

alias GetPoolRequiredParameters = {
  @doc("The ID of the Pool to get.")
  @path
  poolId: string;
};

alias GetPoolOptionalParameters = {
  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];

  @doc("An OData $expand clause.")
  @query
  @clientName("expand", "!autorest")
  $expand?: string[];
};

alias DeletePoolRequiredParameters = {
  @doc("The ID of the Pool to get.")
  @path
  poolId: string;
};

alias UpdatePoolRequiredParameters = {
  @doc("The ID of the Pool to get.")
  @path
  poolId: string;

  @doc("The pool properties to update.")
  @bodyRoot
  pool: BatchPoolUpdateOptions;
};

alias EnablePoolAutoscaleRequiredParameters = {
  @doc("The ID of the Pool to get.")
  @path
  poolId: string;

  @doc("The options to use for enabling automatic scaling.")
  @bodyRoot
  enableAutoScaleOptions: BatchPoolEnableAutoScaleOptions;
};

alias EvaluatePoolAutoScaleRequiredParameters = {
  @doc("The ID of the Pool on which to evaluate the automatic scaling formula.")
  @path
  poolId: string;

  @doc("The options to use for evaluating the automatic scaling formula.")
  @bodyRoot
  evaluateAutoScaleOptions: BatchPoolEvaluateAutoScaleOptions;
};

alias ResizePoolRequiredParameters = {
  @doc("The ID of the Pool to get.")
  @path
  poolId: string;

  @doc("The options to use for resizing the pool.")
  @bodyRoot
  resizeOptions: BatchPoolResizeOptions;
};

alias StopPoolResizeRequiredParameters = {
  @doc("The ID of the Pool to get.")
  @path
  poolId: string;
};

alias ReplacePoolPropertiesRequiredParameters = {
  @doc("The ID of the Pool to update.")
  @path
  poolId: string;

  @doc("The options to use for replacing properties on the pool.")
  @bodyRoot
  pool: BatchPoolReplaceOptions;
};

alias PoolExistsRequiredParameters = {
  @doc("The ID of the Pool to get.")
  @path
  poolId: string;
};

alias RemoveNodesRequiredParameters = {
  @doc("The ID of the Pool to get.")
  @path
  poolId: string;

  @doc("The options to use for removing the node.")
  @bodyRoot
  removeOptions: BatchNodeRemoveOptions;
};

// Job Aliases
alias DeleteJobRequiredParameters = {
  @doc("The ID of the Job to delete.")
  @path
  jobId: string;
};

alias DeleteJobOptionalParameters = {
  @doc("If true, the server will delete the Job even if the corresponding nodes have not fully processed the deletion. The default value is false.")
  @query
  force?: boolean;
};

alias GetJobRequiredParameters = {
  @doc("The ID of the Job.")
  @path
  jobId: string;
};

alias GetJobOptionalParameters = {
  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];

  @doc("An OData $expand clause.")
  @query
  @clientName("expand", "!autorest")
  $expand?: string[];
};

alias UpdateJobRequiredParameters = {
  @doc("The ID of the Job whose properties you want to update.")
  @path
  jobId: string;

  @doc("The options to use for updating the Job.")
  @bodyRoot
  job: BatchJobUpdateOptions;
};

alias ReplaceJobRequiredParameters = {
  @doc("The ID of the Job whose properties you want to update.")
  @path
  jobId: string;

  @doc("A job with updated properties")
  @bodyRoot
  job: BatchJob;
};

alias DisableJobRequiredParameters = {
  @doc("The ID of the Job to disable.")
  @path
  jobId: string;

  @doc("The options to use for disabling the Job.")
  @bodyRoot
  disableOptions: BatchJobDisableOptions;
};

alias EnableJobRequiredParameters = {
  @doc("The ID of the Job to enable.")
  @path
  jobId: string;
};

alias TerminateJobRequiredParameters = {
  @doc("The ID of the Job to terminate.")
  @path
  jobId: string;
};

alias TerminateJobOptionalParameters = {
  @doc("The options to use for terminating the Job.")
  @bodyRoot
  options?: BatchJobTerminateOptions;

  @doc("If true, the server will terminate the Job even if the corresponding nodes have not fully processed the termination. The default value is false.")
  @query
  force?: boolean;
};

alias CreateJobRequiredParameters = {
  @doc("The Job to be created.")
  @bodyRoot
  job: BatchJobCreateOptions;
};

alias ListJobsOptionalParameters = {
  @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://learn.microsoft.com/rest/api/batchservice/odata-filters-in-batch#list-jobs.
    """)
  @query
  @clientName("filter", "!autorest")
  $filter?: string;

  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];

  @doc("An OData $expand clause.")
  @query
  @clientName("expand", "!autorest")
  $expand?: string[];
};

alias ListJobsFromScheduleRequiredParameters = {
  @doc("The ID of the Job Schedule from which you want to get a list of Jobs.")
  @path
  jobScheduleId: string;
};

alias ListJobsFromScheduleOptionalParameters = {
  @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://learn.microsoft.com/rest/api/batchservice/odata-filters-in-batch#list-jobs-in-a-job-schedule.
    """)
  @query
  @clientName("filter", "!autorest")
  $filter?: string;

  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];

  @doc("An OData $expand clause.")
  @query
  @clientName("expand", "!autorest")
  $expand?: string[];
};

alias ListJobPreparationAndReleaseTaskStatusRequiredParameters = {
  @doc("The ID of the Job.")
  @path
  jobId: string;
};

alias ListJobPreparationAndReleaseTaskStatusOptionalParameters = {
  @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://learn.microsoft.com/rest/api/batchservice/odata-filters-in-batch#list-job-preparation-and-release-status.
    """)
  @query
  @clientName("filter", "!autorest")
  $filter?: string;

  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];
};

alias GetJobTaskCountsRequiredParameters = {
  @doc("The ID of the Job.")
  @path
  jobId: string;
};

// Certificate Aliases
alias CreateCertificateRequiredParameters = {
  @doc("The Certificate to be created.")
  @body
  certificate: BatchCertificate;
};

alias ListCertificatesOptionalParameters = {
  @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://docs.microsoft.com/en-us/rest/api/batchservice/odata-filters-in-batch#list-certificates.
    """)
  @query
  @clientName("filter")
  $filter?: string;

  @doc("An OData $select clause.")
  @query
  @clientName("select")
  $select?: string[];
};

alias CancelCertificateDeletionRequiredParameters = {
  @doc("The algorithm used to derive the thumbprint parameter. This must be sha1.")
  @path
  thumbprintAlgorithm: string;

  @doc("The thumbprint of the Certificate being deleted.")
  @path
  thumbprint: string;
};

alias DeleteCertificateRequiredParameters = {
  @doc("The algorithm used to derive the thumbprint parameter. This must be sha1.")
  @path
  thumbprintAlgorithm: string;

  @doc("The thumbprint of the Certificate to be deleted.")
  @path
  thumbprint: string;
};

alias DeleteCertificateResponse = BatchResponseHeaders & {
  @doc("A process exit code.")
  @statusCode
  code: "202";
};

alias GetCertificateRequiredParameters = {
  @doc("The algorithm used to derive the thumbprint parameter. This must be sha1.")
  @path
  thumbprintAlgorithm: string;

  @doc("The thumbprint of the Certificate to get.")
  @path
  thumbprint: string;
};

alias GetCertificateOptionalParameters = {
  @doc("An OData $select clause.")
  @query
  @clientName("select")
  $select?: string[];
};

// Job Schedule Aliases
alias JobScheduleExistsRequiredParameters = {
  @doc("The ID of the Job Schedule which you want to check.")
  @path
  jobScheduleId: string;
};

alias DeleteJobScheduleRequiredParameters = {
  @doc("The ID of the Job Schedule to delete.")
  @path
  jobScheduleId: string;
};

alias DeleteJobScheduleOptionalParameters = {
  @doc("If true, the server will delete the JobSchedule even if the corresponding nodes have not fully processed the deletion. The default value is false.")
  @query
  force?: boolean;
};

alias GetJobScheduleRequiredParameters = {
  @doc("The ID of the Job Schedule to get.")
  @path
  jobScheduleId: string;
};

alias GetJobScheduleOptionalParameters = {
  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];

  @doc("An OData $expand clause.")
  @query
  @clientName("expand", "!autorest")
  $expand?: string[];
};

alias UpdateJobScheduleRequiredParameters = {
  @doc("The ID of the Job Schedule to update.")
  @path
  jobScheduleId: string;

  @doc("The options to use for updating the Job Schedule.")
  @bodyRoot
  jobSchedule: BatchJobScheduleUpdateOptions;
};

alias ReplaceJobScheduleRequiredParameters = {
  @doc("The ID of the Job Schedule to update.")
  @path
  jobScheduleId: string;

  @doc("A Job Schedule with updated properties")
  @bodyRoot
  jobSchedule: BatchJobSchedule;
};

alias DisableJobScheduleRequiredParameters = {
  @doc("The ID of the Job Schedule to disable.")
  @path
  jobScheduleId: string;
};

alias EnableJobScheduleRequiredParameters = {
  @doc("The ID of the Job Schedule to enable.")
  @path
  jobScheduleId: string;
};

alias TerminateJobScheduleRequiredParameters = {
  @doc("The ID of the Job Schedule to terminates.")
  @path
  jobScheduleId: string;
};

alias TerminateJobScheduleOptionalParameters = {
  @doc("If true, the server will terminate the JobSchedule even if the corresponding nodes have not fully processed the termination. The default value is false.")
  @query
  force?: boolean;
};

alias CreateJobScheduleRequiredParameters = {
  @doc("The Job Schedule to be created.")
  @bodyRoot
  jobSchedule: BatchJobScheduleCreateOptions;
};

alias ListJobSchedulesOptionalParameters = {
  @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://learn.microsoft.com/rest/api/batchservice/odata-filters-in-batch#list-job-schedules.
    """)
  @query
  @clientName("filter", "!autorest")
  $filter?: string;

  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];

  @doc("An OData $expand clause.")
  @query
  @clientName("expand", "!autorest")
  $expand?: string[];
};

// Task Aliases
alias CreateTaskRequiredParameters = {
  @doc("The ID of the Job to which the Task is to be created.")
  @path
  jobId: string;

  @doc("The Task to be created.")
  @bodyRoot
  task: BatchTaskCreateOptions;
};

alias ListTasksRequiredParameters = {
  @doc("The ID of the Job.")
  @path
  jobId: string;
};

alias ListTasksOptionalParameters = {
  @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://learn.microsoft.com/rest/api/batchservice/odata-filters-in-batch#list-tasks.
    """)
  @query
  @clientName("filter", "!autorest")
  $filter?: string;

  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];

  @doc("An OData $expand clause.")
  @query
  @clientName("expand", "!autorest")
  $expand?: string[];
};

alias CreateTaskCollectionRequiredParameters = {
  @doc("The ID of the Job to which the Task collection is to be added.")
  @path
  jobId: string;

  @doc("The Tasks to be added.")
  @bodyRoot
  taskCollection: BatchTaskGroup;
};

alias DeleteTaskRequiredParameters = {
  @doc("The ID of the Job from which to delete the Task.")
  @path
  jobId: string;

  @doc("The ID of the Task to delete.")
  @path
  taskId: string;
};

alias DeleteTaskResponse = BatchClientResponseHeaders & {
  @doc("A process exit code.")
  @statusCode
  code: "200";
};

alias GetTaskRequiredParameters = {
  @doc("The ID of the Job that contains the Task.")
  @path
  jobId: string;

  @doc("The ID of the Task to get information about.")
  @path
  taskId: string;
};

alias GetTaskOptionalParameters = {
  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];

  @doc("An OData $expand clause.")
  @query
  @clientName("expand", "!autorest")
  $expand?: string[];
};

alias ReplaceTaskRequiredParameters = {
  @doc("The ID of the Job containing the Task.")
  @path
  jobId: string;

  @doc("The ID of the Task to update.")
  @path
  taskId: string;

  @doc("The Task to update.")
  @bodyRoot
  task: BatchTask;
};

alias ListSubTasksRequiredParameters = {
  @doc("The ID of the Job.")
  @path
  jobId: string;

  @doc("The ID of the Task.")
  @path
  taskId: string;
};

alias ListSubTasksOptionalParameters = {
  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];
};

alias TerminateTaskRequiredParameters = {
  @doc("The ID of the Job containing the Task.")
  @path
  jobId: string;

  @doc("The ID of the Task to terminate.")
  @path
  taskId: string;
};

alias ReactivateTaskRequiredParameters = {
  @doc("The ID of the Job containing the Task.")
  @path
  jobId: string;

  @doc("The ID of the Task to reactivate.")
  @path
  taskId: string;
};

alias ListTaskFilesRequiredParameters = {
  @doc("The ID of the Job that contains the Task.")
  @path
  jobId: string;

  @doc("The ID of the Task whose files you want to list.")
  @path
  taskId: string;
};

alias ListTaskFilesOptionalParameters = {
  @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://learn.microsoft.com/rest/api/batchservice/odata-filters-in-batch#list-task-files.
    """)
  @query
  @clientName("filter", "!autorest")
  $filter?: string;

  @doc("""
    Whether to list children of the Task directory. This parameter can be used in
    combination with the filter parameter to list specific type of files.
    """)
  @query
  recursive?: boolean;
};

alias DeleteTaskFileOptionalParameters = {
  @doc("""
    Whether to delete children of a directory. If the filePath parameter represents
    a directory instead of a file, you can set recursive to true to delete the
    directory and all of the files and subdirectories in it. If recursive is false
    then the directory must be empty or deletion will fail.
    """)
  @query
  recursive?: boolean;
};

alias DeleteTaskFileResponse = BatchClientResponseHeaders & {
  @doc("A process exit code.")
  @statusCode
  code: "200";
};

#suppress "@azure-tools/typespec-azure-core/casing-style" ""
alias GetTaskFileOptionalParameters = {
  @doc("""
    The byte range to be retrieved. The default is to retrieve the entire file. The
    format is bytes=startRange-endRange.
    """)
  @header
  `ocp-range`?: string;
};

alias GetTaskFileResponse = {
  @doc("Type of content")
  @header("content-type")
  contentType: "application/octet-stream";

  @bodyRoot
  @doc("A response containing the file content.")
  file: bytes;
};

// Node Aliases
alias CreateNodeUserRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the machine on which you want to create a user Account.")
  @path
  nodeId: string;

  @doc("The options to use for creating the user.")
  @bodyRoot
  user: BatchNodeUserCreateOptions;
};

alias DeleteNodeUserRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the machine on which you want to delete a user Account.")
  @path
  nodeId: string;

  @doc("The name of the user Account to delete.")
  @path
  userName: string;
};

alias DeleteNodeUserResponse = BatchClientResponseHeaders & {
  @doc("A process exit code.")
  @statusCode
  code: "200";
};

alias ReplaceNodeUserRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the machine on which you want to update a user Account.")
  @path
  nodeId: string;

  @doc("The name of the user Account to update.")
  @path
  userName: string;

  @doc("The options to use for updating the user.")
  @bodyRoot
  updateOptions: BatchNodeUserUpdateOptions;
};

alias GetNodeRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the Compute Node that you want to get information about.")
  @path
  nodeId: string;
};

alias GetNodeOptionalParameters = {
  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];
};

alias StartNodeRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the Compute Node that you want to restart.")
  @path
  nodeId: string;
};

alias RebootNodeRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the Compute Node that you want to restart.")
  @path
  nodeId: string;
};

alias RebootNodeOptionalParameters = {
  @doc("The options to use for rebooting the Compute Node.")
  @bodyRoot
  options?: BatchNodeRebootOptions;
};

alias DeallocateNodeRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the Compute Node that you want to restart.")
  @path
  nodeId: string;
};

alias DeallocateNodeOptionalParameters = {
  @doc("The options to use for deallocating the Compute Node.")
  @bodyRoot
  options?: BatchNodeDeallocateOptions;
};

alias ReimageNodeRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the Compute Node that you want to restart.")
  @path
  nodeId: string;
};

alias ReimageNodeOptionalParameters = {
  @doc("The options to use for reimaging the Compute Node.")
  @body
  options?: BatchNodeReimageOptions;
};

alias DisableNodeSchedulingRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the Compute Node on which you want to disable Task scheduling.")
  @path
  nodeId: string;
};

alias DisableNodeSchedulingOptionalParameters = {
  @doc("The options to use for disabling scheduling on the Compute Node.")
  @bodyRoot
  options?: BatchNodeDisableSchedulingOptions;
};

alias EnableNodeSchedulingRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the Compute Node on which you want to enable Task scheduling.")
  @path
  nodeId: string;
};

alias GetNodeRemoteLoginSettingsRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the Compute Node for which to obtain the remote login settings.")
  @path
  nodeId: string;
};

alias UploadNodeLogsRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("""
    The ID of the Compute Node for which you want to get the Remote Desktop
    Protocol file.
    """)
  @path
  nodeId: string;

  @doc("The Azure Batch service log files upload options.")
  @bodyRoot
  uploadOptions: UploadBatchServiceLogsOptions;
};

alias ListNodesRequiredParameters = {
  @doc("The ID of the Pool from which you want to list Compute Nodes.")
  @path
  poolId: string;
};

alias ListNodesOptionalParameters = {
  @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://learn.microsoft.com/rest/api/batchservice/odata-filters-in-batch#list-nodes-in-a-pool.
    """)
  @query
  @clientName("filter", "!autorest")
  $filter?: string;

  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];
};

alias GetNodeExtensionRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the Compute Node that contains the extensions.")
  @path
  nodeId: string;

  @doc("""
    The name of the Compute Node Extension that you want to get information about.
    """)
  @path
  extensionName: string;
};

alias GetNodeExtensionOptionalParameters = {
  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];
};

alias ListNodeExtensionsRequiredParameters = {
  @doc("The ID of the Pool that contains Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the Compute Node that you want to list extensions.")
  @path
  nodeId: string;
};

alias ListNodeExtensionsOptionalParameters = {
  @doc("An OData $select clause.")
  @query
  @clientName("select", "!autorest")
  $select?: string[];
};

alias DeleteNodeFileOptionalParameters = {
  @doc("""
    Whether to delete children of a directory. If the filePath parameter represents
    a directory instead of a file, you can set recursive to true to delete the
    directory and all of the files and subdirectories in it. If recursive is false
    then the directory must be empty or deletion will fail.
    """)
  @query
  recursive?: boolean;
};

alias DeleteNodeFileResponse = BatchClientResponseHeaders & {
  @doc("A process exit code.")
  @statusCode
  code: "200";
};

#suppress "@azure-tools/typespec-azure-core/casing-style" ""
alias GetNodeFileOptionalParameters = {
  @doc("""
    The byte range to be retrieved. The default is to retrieve the entire file. The
    format is bytes=startRange-endRange.
    """)
  @header
  `ocp-range`?: string;
};

alias GetNodeFileResponse = {
  @doc("Type of content")
  @header("content-type")
  contentType: "application/octet-stream";

  @bodyRoot
  @doc("A response containing the file content.")
  file: bytes;
};

alias ListNodeFilesRequiredParameters = {
  @doc("The ID of the Pool that contains the Compute Node.")
  @path
  poolId: string;

  @doc("The ID of the Compute Node whose files you want to list.")
  @path
  nodeId: string;
};

alias ListNodeFilesOptionalParameters = {
  @doc("""
    An OData $filter clause. For more information on constructing this filter, see
    https://learn.microsoft.com/rest/api/batchservice/odata-filters-in-batch#list-compute-node-files.
    """)
  @query
  @clientName("filter", "!autorest")
  $filter?: string;

  @doc("Whether to list children of a directory.")
  @query
  recursive?: boolean;
};
