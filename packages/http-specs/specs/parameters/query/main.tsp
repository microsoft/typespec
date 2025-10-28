import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test for query parameter cases.")
@scenarioService("/parameters/query")
namespace Parameters.Query;

@doc("Constant query parameter verification")
@route("/constant")
interface Constant {
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to handle a constant value for query and mock api returns nothing")
  @post
  @doc("post constant query value")
  post(
    @query
    queryParam: "constantValue",
  ): void;
}
