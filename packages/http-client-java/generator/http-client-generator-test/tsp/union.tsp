import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.Core.Traits;
using Azure.Core.Foundations;
using Azure.ClientGenerator.Core;

@service({
  title: "Union",
})
@server(
  "{endpoint}/openai",
  "Union",
  {
    endpoint: string,
  }
)
@versioned(ServiceApiVersions)
namespace Cadl.Union;

enum ServiceApiVersions {
  @useDependency(Azure.Core.Versions.v1_0_Preview_2)
  v2022_03_01_preview: "2022-03-01-preview",

  @useDependency(Azure.Core.Versions.v1_0_Preview_2)
  v2022_06_01_preview: "2022-06-01-preview",
}

@doc("The ApiVersion query parameter.")
model ApiVersionParameter {
  @query("api-version")
  @minLength(1)
  @doc("The API version to use for this operation.")
  apiVersion: string;
}

alias Request = {
  user?: User;
  input: string | string[] | integer[] | integer[][];
};

alias LongRequest = {
  user?: User;
  input: string;
  dataInt: int32;
  dataUnion?: string | ArrayData | bytes | utcDateTime;
  dataLong?: int64;
  data_float?: float64;
};

model User {
  user: string;
}

model ArrayData {
  data: string[];
}

@usage(Usage.input | Usage.output)
model Result {
  name: string;
  result?: Result;
  data: bytes | Result;
}

model Query {
  @query
  data?: url | bytes;
}

@access(Access.internal)
@usage(Usage.input | Usage.output)
model SubResult extends Result {
  text?: string;
  arrayData?: bytes | ArrayData;
}

@route("/union")
interface UnionFlattenOp {
  @route("send")
  @post
  send(@query id: string, ...Request, ...ApiVersionParameter): OkResponse;

  @route("send-long")
  @post
  sendLong(
    @query id: string,
    @query filter?: string,
    ...LongRequest,
    ...ApiVersionParameter,
  ): OkResponse;

  @route("param")
  @get
  get(...Query): OkResponse;

  @route("generate")
  generate is LongRunningRpcOperation<{}, OperationStatus<Result>, Result>;
}
