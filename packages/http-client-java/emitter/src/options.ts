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
  properties: {
    namespace: {
      type: "string",
      nullable: true,
      description:
        "Java package/namespace. If not provided, emitter would use package name converted from TypeSpec namespace.",
    },
    "dev-options": {
      type: "object",
      description: "Developer options for http-client-java emitter.",
      properties: {
        "generate-code-model": {
          type: "boolean",
          description: "Generate intermittent 'code-model.yaml' file in output directory.",
          nullable: true,
        },
        debug: {
          type: "boolean",
          description: "Enable Java remote debug on port 5005.",
          nullable: true,
        },
        loglevel: {
          type: "string",
          description: "Log level for Java logging. Default is 'warn'.",
          nullable: true,
          enum: ["off", "debug", "info", "warn", "error"],
        },
        "java-temp-dir": {
          type: "string",
          description: "Temporary working directory for Java code generator.",
          nullable: true,
        },
      },
      nullable: true,
      additionalProperties: false,
      required: [],
    },
  },
  additionalProperties: false,
  required: [],
};
