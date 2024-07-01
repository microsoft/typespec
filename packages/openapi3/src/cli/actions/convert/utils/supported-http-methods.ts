import { HttpVerb } from "@typespec/http";

export const supportedHttpMethods = new Set<HttpVerb>([
  "delete",
  "get",
  "head",
  "patch",
  "post",
  "put",
]);
