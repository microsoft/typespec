import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

/**
 * Test for operations whose successful response is either a model body (200) or no content (204).
 */
@scenarioService("/response/body-or-no-content")
namespace Response.BodyOrNoContent;

model BlobLayout {
  content: string;
}

/**
 * Response of an operation whose success may either contain a model body or contain no body at all.
 *
 * Emitters must distinguish this from a nullable body on a single response: the operation succeeded
 * in both cases, but the `204` variant has no representation.
 */
alias LayoutResponse =
  | {
      @statusCode statusCode: 200;
      @body layout: BlobLayout;
    }
  | {
      @statusCode statusCode: 204;
    };

@scenario
@scenarioDoc("""
  Operation that returns a successful response with a status code of 200 and a `BlobLayout` body.
  
  Both `200` and `204` are declared as successful responses, but this route always returns `200`.
  Expected response status code is 200 with body:
  ```json
  { "content": "hello" }
  ```
  Verify that the `200` response is deserialized normally and that the raw response status and
  headers remain available.
  """)
@route("/body")
@get
op getBody(): LayoutResponse;

@scenario
@scenarioDoc("""
  Operation that returns a successful response with a status code of 204 and no content.
  
  Both `200` and `204` are declared as successful responses, but this route always returns `204`.
  Expected response status code is 204 with no body.
  Verify that the `204` response is classified as successful, that it does not attempt body
  deserialization, and that the raw response status and headers remain available.
  """)
@route("/no-content")
@get
op getNoContent(): LayoutResponse;
