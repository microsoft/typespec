import "@typespec/http";

using TypeSpec.Http;

@service
namespace SpecialHeaders;

@get
op read(
  @header("x-custom") custom?: string,
  @header("x-ms-client-request-id") clientRequestId?: string,
): void;
