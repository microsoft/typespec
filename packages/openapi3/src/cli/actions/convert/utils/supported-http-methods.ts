import { SupportedHttpMethods } from "../interfaces.js";

export const supportedHttpMethods = new Set<SupportedHttpMethods>([
  "delete",
  "get",
  "head",
  "patch",
  "post",
  "put",
]);
