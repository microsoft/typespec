import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Test describing optionality of the request body.")
@scenarioService("/content-negotiation")
namespace Payload.ContentNegotiation;

@scenario
@scenarioDoc("""
  Scenario that returns a different file encoding depending on the accept header.
  
  - image/png return a png image
  - image/jpeg return a jpeg image
  """)
@route("same-body")
namespace SameBody {
  model PngImage {
    @header contentType: "image/png";
    @body image: bytes;
  }

  model JpegImage {
    @header contentType: "image/jpeg";
    @body image: bytes;
  }

  @sharedRoute
  op getAvatarAsPng(@header accept: "image/png"): PngImage;

  @sharedRoute
  op getAvatarAsJpeg(@header accept: "image/jpeg"): JpegImage;
}

@scenario
@scenarioDoc("""
  Scenario that a different payload depending on the accept header.
  
  - application/json return a png image in a Json object
  - image/png return the png image
  """)
@route("different-body")
namespace DifferentBody {
  model PngImage {
    @header contentType: "image/png";
    @body image: bytes;
  }

  model PngImageAsJson {
    @header contentType: "application/json";
    content: bytes;
  }

  @sharedRoute
  op getAvatarAsPng(@header accept: "image/png"): PngImage;

  @sharedRoute
  op getAvatarAsJson(@header accept: "application/json"): PngImageAsJson;
}
