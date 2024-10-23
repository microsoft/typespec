import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service({
  title: "PartialUpdate",
})
namespace Cadl.PartialUpdate;

model PartialUpdateModel {
  boolean: boolean;
  string: string;
  bytes: bytes;

  @doc("""
    The aggregation function to be applied on the client metric. Allowed functions
    - ‘percentage’ - for error metric , ‘avg’, ‘p50’, ‘p90’, ‘p95’, ‘p99’, ‘min’,
    ‘max’ - for response_time_ms and latency metric, ‘avg’ - for requests_per_sec,
    ‘count’ - for requests
    """)
  aggregate?: string;
}

@client({
  service: Cadl.PartialUpdate,
  name: "PartialUpdateClient",
})
@route("/partialupdate")
interface PartialUpdateOp {
  read(): {
    @body body: PartialUpdateModel;
  };
}
