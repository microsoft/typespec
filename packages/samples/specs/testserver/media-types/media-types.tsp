import "@typespec/rest";
import "@typespec/openapi";

using Http;
using OpenAPI;

@service(#{ title: "sample" })
namespace Sample;

@doc("Uri or local path to source data.")
model SourcePath {
  @minLength(0)
  @maxLength(2048)
  @doc("File source path.")
  source: string;
}

model Input {
  @doc("Input parameter.")
  @body
  input: SourcePath;
}

@route("/mediatypes")
namespace MediaTypes {
  @doc("Analyze body, that could be different media types.")
  @route("analyze")
  @operationId("AnalyzeBody")
  @post
  op analyzeBody(
    ...Input,
    @header contentType:
      | "application/pdf"
      | "application/json"
      | "image/jpeg"
      | "image/png"
      | "image/tiff",
  ): string;

  @doc("Pass in contentType 'text/plain; encoding=UTF-8' to pass test. Value for input does not matter")
  @route("contentTypeWithEncoding")
  @operationId("contentTypeWithEncoding")
  @post
  op contentTypeWithEncoding(...Input, @header contentType: "text/plain"): string;
}
