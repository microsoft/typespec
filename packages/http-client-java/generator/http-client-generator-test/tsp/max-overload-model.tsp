import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.Core.Foundations;
using Azure.Core.Traits;
using Azure.ClientGenerator.Core;

@service(#{ title: "MaxOverloadModel" })
@versioned(Versions)
namespace TspTest.MaxOverloadModel;

enum Versions {
  v1: "2025-01-01",
  v2: "2026-01-01",
}

model RequestModel {
  name: string;
}

model ResponseModel {
  name: string;
}

enum RequestStatus {
  succeeded,
  failed,
}

model ResponseWithHeaders {
  @header("x-request-id")
  requestId: string;

  @header("x-request-status")
  requestStatus: RequestStatus;

  @body
  body: ResponseModel;
}

@resource("resources")
model ResourceModel {
  @visibility(Lifecycle.Read)
  id: string;

  @key
  name: string;
}

@trait
model ListTrait {
  @traitContext(TraitContext.List)
  request: {
    @traitLocation(TraitLocation.Parameters)
    properties: {
      @query
      filter?: string;
    };
  };
}

interface ResourceOperations
  extends Azure.Core.ResourceOperations<NoRepeatableRequests &
      NoConditionalRequests &
      NoClientRequestId> {}

@route("/items/{id}")
@post
op create(
  @path id: string,
  @body body: RequestModel,
  @query optional?: string,
  @added(Versions.v2) @query added?: string,
): ResponseModel;

@route("/items/{id}/headers")
@get
op getWithHeaders(@path id: string): ResponseWithHeaders;

@pollingOperation(ResourceOperations.GetResourceOperationStatus<ResourceModel, never>)
op createOrReplace is ResourceOperations.LongRunningResourceCreateOrReplace<ResourceModel>;

op list is ResourceOperations.ResourceList<ResourceModel, ListTrait>;

@route("/resource-metadata")
@head
op getResourceMetadata(): {
  @statusCode statusCode: 200;
  @header("ETag") eTag: string;
  @header("x-resource-count") resourceCount: int32;
};

@@clientOption(getResourceMetadata, "responseHeadersAsModel", true, "java");
