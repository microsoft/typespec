import { createPackage } from "@alloy-js/typescript";

export const uriTemplateLib = createPackage({
  name: "uri-template",
  version: "^2.0.0",
  descriptor: {
    ".": {
      named: ["parse"],
    },
  },
});
