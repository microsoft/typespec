import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Test for HTTP redirect status codes.
 */
@scenarioService("/response/redirect")
namespace Response.Redirect;

@scenario
@scenarioDoc("""
  Test case for 302 redirect response.
  
  Verify that the client can receive and process a 302 redirect response with a Location header.
  This is commonly used in OAuth-style authorization flows where the service provides a redirect
  URI that the application can use to navigate users to the mobile operator's network for authentication.
  
  Expected status code 302 and response headers:
  - Location: /redirected
  """)
@route("/302")
@get
op redirect302(): {
  @statusCode
  _: 302;

  @header
  location: url;
};
