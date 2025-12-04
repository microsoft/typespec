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
  /** post constant query value */
  @scenario
  @scenarioDoc("Expect to handle a constant value for query and mock api returns nothing")
  @post
  post(
    @query
    queryParam: "constantValue",
  ): void;
}
