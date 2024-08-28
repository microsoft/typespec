import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.Core;
using Azure.ClientGenerator.Core;

@service({
  title: "Internal",
})
namespace Cadl.Internal;

// ApiRequest and RequestInner will be generated
@access(Access.public)
model ApiRequest {
  property: RequestInner;
}

model RequestInner {
  name: string;
}

// ResponseInternal and ResponseInternalInner will be generated in implementation.models package
model ResponseInternal {
  property: ResponseInternalInner;
}

@access(Access.public, "python")
model ResponseInternalInner {
  name: string;
}

// Response will be generated as output-only
@access(Access.public)
model ApiResponse {
  name: string;
}

// StandAloneData will be generated as output
@access(Access.public)
@usage(Usage.output, "java")
model StandAloneData {
  property: StandAloneDataInner;
}

// StandAloneDataInner will be generated as intput + output
@usage(Usage.input | Usage.output)
model StandAloneDataInner {
  name: string;
}

// StandAloneUnion will be generated in implementation.models package
@access(Access.internal)
model StandAloneUnion {
  data: url | bytes;
}

// Color and ColorModel will be generated in implementation.models package
#suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "For testing"
@access(Access.internal)
@usage(Usage.input | Usage.output)
enum Color {
  Red,
  Blue,
  Green,
}

@access(Access.internal)
@usage(Usage.input | Usage.output)
union ColorModel {
  string,
  "Red",
  "Blue",
  "Green",
}

// UnusedEnum will be generated
@access(Access.public)
@usage(Usage.input | Usage.output)
union UnusedEnum {
  string,
  "Weekday",
  "Weekend",
}

// ProtocolInternalModel will not be generated, as the model is not used in convenient API
model ProtocolInternalModel {
  name: string;
}

@route("/internal")
interface InternalOp {
  // test ApiRequest with Access.public
  @access(Access.public, "python")
  @access(Access.internal, "client")
  @post
  postInternal(@body body: ApiRequest): ResponseInternal;

  // test ApiResponse with Access.public
  @get
  @access(Access.internal, "java")
  getInternal(): ApiResponse;

  @route("/protocal-internal")
  @post
  @access(Access.internal)
  @convenientAPI(false)
  postProtocalInternal(@body body: ProtocolInternalModel): void;
}
