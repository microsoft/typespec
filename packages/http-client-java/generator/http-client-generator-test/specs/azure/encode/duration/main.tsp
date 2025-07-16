import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using global.Azure.ClientGenerator.Core;
using Spector;

@doc("Test for azure related encode decorator.")
@scenarioService("/azure/encode/duration")
namespace _Specs_.Azure.Encode.Duration;

@@clientNamespace(_Specs_.Azure.Encode.Duration, "azure.encode.duration", "java");

model DurationModel {
  @encode("duration-constant")
  input: duration;
}

@scenario
@scenarioDoc("""
  Test case for azure specific encoding. SDK should generate correct serialization format according to the set encoding.
  Expected request body:
  ```json
  {
    "input": "1.02:59:59.5000000"
  }
  ```
  """)
@doc("Test duration with azure specific encoding.")
@put
@route("/duration-constant")
op durationConstant(@body body: DurationModel): NoContentResponse;
