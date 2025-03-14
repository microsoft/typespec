import { JSONSchemaType } from "@typespec/compiler";

export const LIB_NAME = "@typespec/http-client-java";

export interface DevOptions {
  "generate-code-model"?: boolean;
  debug?: boolean;
  loglevel?: "off" | "debug" | "info" | "warn" | "error";
  "java-temp-dir"?: string; // working directory for java codegen, e.g. transformed code-model file
}

export interface EmitterOptions {
  "dev-options"?: DevOptions;
}

export const EmitterOptionsSchema: JSONSchemaType<EmitterOptions> = {
  type: "object",
  additionalProperties: true,
  properties: {
    "dev-options": { type: "object", additionalProperties: true, nullable: true },
  },
  required: [],
};
