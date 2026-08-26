import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";
import "@azure-tools/typespec-azure-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.Core.Foundations;
using Azure.Core.Traits;
using Azure.ClientGenerator.Core;

@service(#{ title: "ProtocolAndConvenient" })
@versioned(ApiVersions)
namespace TspTest.ProtocolAndConvenient;

enum ApiVersions {
  v2022_06_01_preview: "2022-06-01-preview",
}

model ResourceA {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;
}

model ResourceB {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;
}

model ResourceC {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;
}

model ResourceD {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;
}

model ResourceE {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;
}

model ResourceF {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;
}

model ResourceG {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;
}

model ResourceH {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;
}

@resource("resources")
model ResourceI {
  @visibility(Lifecycle.Read)
  id: string;

  @visibility(Lifecycle.Read)
  @key
  name: string;

  type: string;
}

@resource("resources")
model ResourceJ {
  @visibility(Lifecycle.Read)
  id: string;

  @visibility(Lifecycle.Read)
  @key
  name: string;

  type: string;
}

@trait
model ListTrait {
  @traitContext(TraitContext.List)
  request: {
    @traitLocation(TraitLocation.Parameters)
    properties: {
      @clientName("maxPageSize")
      @query
      maxresults?: safeint;
    };
  };
}

interface ResourceOperations
  extends Azure.Core.ResourceOperations<NoRepeatableRequests &
      NoConditionalRequests &
      NoClientRequestId> {}

@route("protocolandconvenient")
interface ProtocolAndConvenienceOp {
  @doc("When set protocol false and convenient true, then the protocol method should be package private")
  @route("onlyConvenient")
  @post
  @convenientAPI(true)
  @protocolAPI(false)
  onlyConvenient(@body body: ResourceA): ResourceB;

  @doc("When set protocol true and convenient false, only the protocol method should be generated, ResourceC and ResourceD should not be generated")
  @route("onlyProtocol")
  @post
  @convenientAPI(false)
  @protocolAPI(true)
  onlyProtocol(@body body: ResourceC): ResourceD;

  @doc("Setting protocol true and convenient true, both convenient and protocol methods will be generated")
  @route("bothConvenientAndProtocol")
  @post
  @convenientAPI(true)
  @protocolAPI(true)
  bothConvenientAndProtocol(@body body: ResourceE): ResourceF;

  @doc("When set protocol false and convenient false")
  @route("errorSetting")
  @post
  @convenientAPI(false)
  @protocolAPI(false)
  errorSetting(@body body: ResourceG): ResourceH;

  @doc("Long running operation")
  @pollingOperation(ResourceOperations.GetResourceOperationStatus<ResourceI, never>)
  @protocolAPI(false)
  createOrReplace is ResourceOperations.LongRunningResourceCreateOrReplace<ResourceI>;

  @doc("Paging operation")
  @protocolAPI(false)
  list is ResourceOperations.ResourceList<ResourceJ, ListTrait>;
}
