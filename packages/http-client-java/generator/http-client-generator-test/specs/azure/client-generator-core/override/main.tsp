import "@typespec/http";
import "@typespec/spector";
import "@azure-tools/typespec-client-generator-core";

using Http;
using Spector;

@doc("Test scenarios for client override behavior.")
@scenarioService("/azure/client-generator-core/override")
namespace _Specs_.Azure.ClientGenerator.Core.Override;

interface ReorderParameters {
  @scenario
  @scenarioDoc("""
    Verify that after `@override` the parameters are reordered correctly in the client method signature.
    
    Expected path parameter:
    param1: param1
    param2: param2
    
    Expected response: 204 No Content
    """)
  @route("/reorder/{param2}/{param1}")
  @get
  reorder(@path param2: string, @path param1: string): void;
}

interface GroupParameters {
  @scenario
  @scenarioDoc("""
    Verify that after `@override` the parameters are grouped correctly to `GroupParametersOptions` in the client method signature.
    
    Expected query parameter:
    param1: param1
    param2: param2
    
    Expected response: 204 No Content
    """)
  @route("/group")
  @get
  group(@query param1: string, @query param2: string): void;
}
