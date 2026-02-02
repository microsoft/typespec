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

@doc("List query parameter verification")
@route("/list")
interface QueryList {
  /** send list query parameter */
  @scenario
  @scenarioDoc("""
    Expect to handle a list of values for query parameter.
    The list should be serialized as CSV (comma-separated values).
    Pass array ["a", "b", "c"] and expect it to be serialized as "a,b,c".
    """)
  @post
  post(
    @query
    listParameter: string[],
  ): void;
}
