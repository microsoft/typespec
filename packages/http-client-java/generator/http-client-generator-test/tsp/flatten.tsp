import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Versioning;
using Azure.ClientGenerator.Core;

@service({
  title: "Flatten",
})
@server(
  "{endpoint}/openai",
  "Flatten",
  {
    endpoint: string,
  }
)
@versioned(ServiceApiVersions)
namespace Cadl.Flatten;

enum ServiceApiVersions {
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
  @visibility("read") @key name: string;
  endpoint: string;
  user?: User;
  input: string;
  constant: "constant";
  requiredInt: int32;
};

alias LongRequest = {
  user?: User;
  input: string;
  dataInt: int32;
  dataIntOptional?: int32;
  dataLong?: int64;
  requiredUser: User;

  @clientName("dataFloat")
  @encodedName("application/json", "data_float")
  float?: float64;
};

model User {
  user: string;
}

model TodoItem {
  /** The item's unique id */
  @visibility("read") @key id: safeint;

  /** The item's title */
  @maxLength(255)
  title: string;

  /** A longer description of the todo item in markdown format */
  description?: string;

  /** The status of the todo item */
  status: "NotStarted" | "InProgress" | "Completed";

  /** When the todo item was created. */
  @visibility("read") createdAt: utcDateTime;

  /** When the todo item was last updated */
  @visibility("read") updatedAt: utcDateTime;

  /** When the todo item was makred as completed */
  @visibility("read") completedAt?: utcDateTime;

  // hack to get a different schema for create
  // (fastify glue doesn't support readonly)
  @visibility("create") _dummy?: string;
}

model TodoItemPatch {
  /** The item's title */
  title?: TodoItem.title;

  /** A longer description of the todo item in markdown format */
  description?: TodoItem.description | null;

  /** The status of the todo item */
  status?: "NotStarted" | "InProgress" | "Completed";
}

@client({
  service: Cadl.Flatten,
  name: "FlattenClient",
})
@route("/flatten")
interface FlattenOp {
  @route("send")
  @post
  send(
    @query id: string,
    @query constantQueryParam: "constant",
    ...Request,
    ...ApiVersionParameter,
  ): OkResponse;

  @route("send-projected-name")
  @post
  sendProjectedName(
    @query id: string,

    @encodedName("application/json", "file_id")
    @projectedName("client", "fileIdentifier")
    fileId: string,
  ): OkResponse;

  @route("send-long")
  @post
  sendLong(
    @query name: string,
    @query filter?: string,
    ...LongRequest,
    ...TodoItem,
    constant: "constant",
    ...ApiVersionParameter,
  ): OkResponse;

  @route("patch/{id}")
  @patch
  update(
    @header contentType: "application/merge-patch+json",
    @path id: TodoItem.id,
    patch: TodoItemPatch,
  ): {
    @body response: TodoItem;
  };

  @route("upload/{name}")
  @post
  uploadFile(
    @path name: string,
    @header contentType: "multipart/form-data",
    file_data: bytes,

    // this field should not be serialized to form-data
    @visibility("read") readOnly: string,

    constant: "constant",
  ): OkResponse;

  @route("upload-todo")
  @post
  uploadTodo(
    @header contentType: "multipart/form-data",
    ...TodoItem,
    prop1?: string,
    prop2?: string,
    prop3?: string,
  ): OkResponse;
}
