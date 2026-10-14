import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

export const HttpServerEmitterTester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/http", "@typespec/http-server-js"],
})
  .import("@typespec/http")
  .using("Http")
  .emit("@typespec/http-server-js");
