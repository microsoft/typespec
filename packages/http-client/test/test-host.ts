import { resolvePath } from "@typespec/compiler";
import { createTester } from "@typespec/compiler/testing";

export const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/http", "@typespec/http-client"],
})
  .import("@typespec/http", "@typespec/http-client")
  .using("Http", "HttpClient");
