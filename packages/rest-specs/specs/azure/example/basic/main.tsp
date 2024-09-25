import "@typespec/http";
import "@typespec/rest";
import "@azure-tools/cadl-ranch-expect";
import "@typespec/versioning";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;

/** Test for loading JSON example and generating sample code. */
@supportedBy("dpg")
@scenarioService(
  "/azure/example/basic",
  {
    versioned: Versions,
  }
)
namespace _Specs_.Azure.Example.Basic;

enum Versions {
  v2022_12_01_preview: "2022-12-01-preview",
}

model ApiVersionParameter {
  @query("api-version")
  @minLength(1)
  @doc("The API version to use for this operation.")
  apiVersion: string;
}

model ActionRequest {
  stringProperty: string;
  modelProperty?: Model;
  arrayProperty?: Array<string>;
  recordProperty?: Record<string>;
}

model Model {
  int32Property?: int32;
  float32Property?: float32;
  enumProperty?: Enum;
}

union Enum {
  string,
  "EnumValue1",
}

model ActionResponse is ActionRequest;

interface ServiceOperationGroup {
  #suppress "@azure-tools/cadl-ranch-expect/missing-scenario" "scenario defined in client.tsp"
  @route("/basic")
  @post
  basic(
    ...ApiVersionParameter,
    @query("query-param") queryParam: string,
    @header("header-param") headerParam: string,
    @body body: ActionRequest,
  ): ActionResponse;
}
