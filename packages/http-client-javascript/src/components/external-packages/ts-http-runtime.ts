import { createPackage } from "@alloy-js/typescript";

export const httpRuntimeTemplateLib = createPackage({
  name: "@typespec/ts-http-runtime",
  version: "1.0.0-alpha.20240611.3",
  descriptor: {
    ".": {
      named: [
        "Client",
        "ClientOptions",
        "getClient",
        "KeyCredential",
        "TokenCredential",
        "isKeyCredential",
      ],
    },
  },
});
