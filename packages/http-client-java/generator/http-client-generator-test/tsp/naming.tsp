import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.Core;
using Azure.Core.Foundations;
using Azure.ClientGenerator.Core;

@summary("summary of Naming")
@doc("description of Naming")
@service({
  title: "Naming",
})
namespace Cadl.Naming;

@summary("summary of Response")
@doc("description of Response. Include tab '	' in doc.")
@friendlyName("DataResponse")
model Response {
  @summary("summary of name property")
  @doc("description of name property")
  name: string;

  @summary("summary of data property")
  @doc("description of data property")
  data: DataModel;

  @summary("summary of type property")
  @doc("description of type property")
  @friendlyName("dataType")
  type: TypesModel;

  @summary("summary of status property")
  @doc("description of status property")
  status: StatusModel;

  anonymous: RunObject;
}

model RunObject {
  last_error: {
    code: "server_error" | "rate_limit_exceeded" | "invalid_prompt";
  } | null;
}

@summary("summary of Data")
@doc("description of Data")
@friendlyName("BinaryData")
model DataModel {
  @summary("summary of data property")
  @doc("description of data property")
  data: Data;
}

// "@" should be escaped
@doc("Dummy doc to make the javadoc break at the 'at' symbol. The type of the Data depends on @data.kind.letusmakeitlongsoitwouldbreakbeforethis field")
@discriminator("kind")
model Data {
  // "@" should be escaped
  @clientName("type")
  @encodedName("application/json", "@data.kind")
  kind: string;
}

model BytesData extends Data {
  @clientName("type")
  @encodedName("application/json", "@data.kind")
  kind: "bytes";

  // "{@code}" should not be escaped
  @doc("Data as {@code byte[]}")
  @clientName("dataAsBytes")
  @encodedName("application/json", "data_bytes")
  @projectedName("client", "noeffect")
  data: bytes;
}

#suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "For testing"
@summary("summary of Types")
@doc("description of Types")
enum TypesModel {
  Blob,
  File,
}

@summary("summary of Statuses")
@doc("description of Statuses")
@friendlyName("DataStatus")
union StatusModel {
  string,

  @clientName("LroRunning")
  Running: "Running",

  Completed: "Completed",
  Failed: "Failed",
}

@summary("summary of Request")
@doc("description of Request")
@friendlyName("DataRequest")
model Request {
  @summary("summary of name query parameter")
  @doc("description of name query parameter")
  @query
  name: string;

  @header
  @summary("summary of etag header parameter")
  @doc("description of etag header parameter")
  etag?: string;

  parameters?: {
    type: "Type1" | "Type2";
  };
}

@summary("summary of naming route")
@doc("description of naming route")
@route("/naming")
interface NamingOp {
  @summary("summary of POST op")
  @doc("description of POST op")
  @post
  post(@bodyRoot body: Request): Response | ErrorResponse;

  getAnonymous(): {
    name: string;
  };
}
