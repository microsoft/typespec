import { Type } from "@typespec/compiler";

export * from "./client-library.js";
export * from "./client.js";
export * from "./model-property.js";
export * from "./model.js";
export * from "./operation.js";

export interface ClientExtensionOptions {
  getName: (type: Type & { name?: string | symbol }) => string;
}
