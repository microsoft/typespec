import "@typespec/http";

using Http;

namespace Test.FileInline;

@post
op upload(@bodyRoot file: Http.File<"image/png">): void;
