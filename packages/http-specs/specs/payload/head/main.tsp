import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test scenario for HEAD operation returning response headers.")
@scenarioService("/payload/head")
namespace Payload.Head;

alias MetadataHeaders = {
  /** The metadata headers. */
  @header("x-ms-meta")
  metadata?: string;
};

@scenario
@scenarioDoc("""
  A HEAD operation that returns response headers including Content-Type and x-ms-meta.
  
  Expected response headers:
  - Content-Type: text/plain; charset=utf-8
  - x-ms-meta: hello
  """)
@head
@route("/properties")
op getProperties(): {
  /** Content-type. */
  #suppress "@typespec/http/content-type-ignored" "This is a HEAD operation, so content-type header can be returned."
  @header("Content-Type")
  contentType?: string;

  ...MetadataHeaders;
};
