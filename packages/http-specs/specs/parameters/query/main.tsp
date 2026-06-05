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

@doc("Special char query parameter verification")
@route("/special-char")
interface SpecialChar {
  @scenario
  @scenarioDoc("""
    Send a request with a dollar-sign prefixed`$filter` query parameter.
    
    Expected query parameter:
    - `$filter` = "status eq 'active'"
    
    Expected response status code: 204
    """)
  @route("/dollarSign")
  @get
  dollarSign(
    @query("$filter")
    filter: string,
  ): void;
}
