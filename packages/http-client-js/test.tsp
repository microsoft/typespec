import "@typespec/http";

using Http;
@service(#{ title: "Widget Service" })
namespace Test;
@post
@route("/non-string-float")
op float(
  @header contentType: "multipart/form-data",
  @multipartBody body: {
    temperature: HttpPart<{
      @body body: float64;
      @header contentType: "text/plain";
    }>;
  },
): NoContentResponse;
