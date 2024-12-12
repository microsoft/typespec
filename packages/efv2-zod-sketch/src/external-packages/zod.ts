import { createPackage } from "@alloy-js/typescript";

export const zod = createPackage({
  name: "zod",
  version: "^3.23.0",
  descriptor: {
    ".": {
      named: ["z"],
    },
  },
});
