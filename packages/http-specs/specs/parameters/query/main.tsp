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
  @route("/dollar-sign")
  @get
  dollarSign(
    @query("$filter")
    filter: string,
  ): void;
}

@doc("Explode query parameter with an object value")
model FilterOptions {
  field: string;
  value: string;
}

@doc("Object query parameter with explode verification")
@route("/explode")
interface Explode {
  @scenario
  @scenarioDoc("""
    Send an object-valued query parameter using `@query(#{ explode: true })`. Per RFC 6570 form
    explode, each property of the object is expanded into its own query parameter using the property
    name as the key (the parameter name itself is not emitted).
    
    Expected query parameters:
    - `field` = "status"
    - `value` = "active"
    
    Expected response status code: 204
    """)
  @route("/object")
  @get
  object(
    @query(#{ explode: true })
    filter: FilterOptions,
  ): void;
}
