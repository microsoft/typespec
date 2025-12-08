import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "(title)" })
@info(#{ version: "0.0.0" })
@tagMetadata("consents", #{})
namespace title;

model Consent {
  id: string;
}

@tag("consents")
@route("/")
@get
op getConsent(): Consent;
