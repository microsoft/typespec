import { createPackage } from "@alloy-js/typescript";

export const httpRuntimeTemplateLib = createPackage({
  name: "@typespec/ts-http-runtime",
  version: "0.1.0",
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
