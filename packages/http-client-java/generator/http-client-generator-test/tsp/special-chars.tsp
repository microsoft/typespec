import "@typespec/rest";

using TypeSpec.Http;

@service({
  title: "SpecialChars",
})
namespace Cadl.SpecialChars;

model Resource {
  @doc("id")
  id: string;

  @doc("""
    The aggregation function to be applied on the client metric. Allowed functions
    - ‘percentage’ - for error metric , ‘avg’, ‘p50’, ‘p90’, ‘p95’, ‘p99’, ‘min’,
    ‘max’ - for response_time_ms and latency metric, ‘avg’ - for requests_per_sec,
    ‘count’ - for requests
    """)
  aggregate?: string;

  @doc("The comparison operator. Supported types ‘>’, ‘<’ ")
  condition?: string;

  @doc("Request name for which the Pass fail criteria has to be applied ")
  requestName?: string;

  @doc("""
    The value to compare with the client metric. Allowed values - ‘error : [0.0 ,
    100.0] unit- % ’, response_time_ms and latency : any integer value unit- ms.
    """)
  value?: float32;
}

@route("/specialchars")
interface BuiltinOp {
  read(id: string): {
    @body body: Resource;
  };
}
