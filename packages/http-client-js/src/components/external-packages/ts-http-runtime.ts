import { createPackage } from "@alloy-js/typescript";

export const httpRuntimeTemplateLib = createPackage({
  name: "@typespec/ts-http-runtime",
  version: "0.2.1",
  descriptor: {
    ".": {
      named: [
        "Client",
        "ClientOptions",
        "getClient",
        "ApiKeyCredential",
        "BasicCredential",
        "BearerTokenCredential",
        "OAuth2TokenCredential",
        "AuthorizationCodeFlow",
        "ClientCredentialsFlow",
        "ImplicitFlow",
        "PasswordFlow",
        "PathUncheckedResponse",
        "PipelineRequest",
        "HttpResponse",
        "RawHttpHeaders",
      ],
    },
  },
});
