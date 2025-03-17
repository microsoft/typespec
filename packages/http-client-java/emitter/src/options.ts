import { JSONSchemaType } from "@typespec/compiler";

// typespec-java has another "options.ts" file, with same "export".
// If add/remove "export" here, please also check typespec-java in autorest.java repository.

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
    "dev-options": {
      type: "object",
      properties: {
        "generate-code-model": {
          type: "boolean",
          nullable: true,
          description: "Generate intermittent 'code-model.yaml' file in output directory.",
        },
        debug: {
          type: "boolean",
          nullable: true,
          description: "Enable Java remote debug on port 5005.",
        },
        loglevel: {
          type: "string",
          nullable: true,
          enum: ["off", "debug", "info", "warn", "error"],
          description: "Log level for Java logging. Default is 'warn'.",
        },
        "java-temp-dir": {
          type: "string",
          nullable: true,
          description: "Temporary working directory for Java code generator.",
        },
        required: [],
      },
      additionalProperties: false,
      nullable: true,
      description: "Developer options for http-client-java emitter.",
    },
  },
  required: [],
};
