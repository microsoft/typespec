import { createPackage } from "@alloy-js/typescript";

/**
 * This defines the external uri-template, registering its symbols for
 * their use throughout the emitter.
 */
export const uriTemplateLib = createPackage({
  name: "uri-template",
  version: "^2.0.0",
  descriptor: {
    ".": {
      named: ["parse"],
    },
  },
});
