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

@doc("Dollar-sign prefixed query parameter verification")
@route("/dollar-sign")
interface DollarSign {
  @scenario
  @scenarioDoc("""
    Send a request with a `$filter` query parameter.
    
    Expected query parameter:
    - `$filter` = "status eq 'active'"
    
    Expected response status code: 204
    """)
  @route("/filter")
  @get
  filter(
    @query("$filter")
    filter: string,
  ): void;

  @scenario
  @scenarioDoc("""
    Send a request with `$top` and `$skip` query parameters.
    
    Expected query parameters:
    - `$top` = 10
    - `$skip` = 5
    
    Expected response status code: 204
    """)
  @route("/top-and-skip")
  @get
  topAndSkip(
    @query("$top")
    top: int32,

    @query("$skip")
    skip: int32,
  ): void;

  @scenario
  @scenarioDoc("""
    Send a request with a `$orderby` query parameter.
    
    Expected query parameter:
    - `$orderby` = "name asc"
    
    Expected response status code: 204
    """)
  @route("/orderby")
  @get
  orderby(
    @query("$orderby")
    orderby: string,
  ): void;
}
