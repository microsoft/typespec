import { JSONSchemaType } from "ajv";
import { ADLRawConfig } from "./types.js";

export const ADLConfigJsonSchema: JSONSchemaType<ADLRawConfig> = {
  type: "object",
  additionalProperties: false,
  properties: {
    plugins: {
      type: "array",
      nullable: true,
      items: {
        type: "string",
      },
    },
    lint: {
      type: "object",
      nullable: true,
      additionalProperties: false,
      properties: {
        extends: {
          type: "array",
          nullable: true,
          items: {
            type: "string",
          },
        },
        rules: {
          type: "object",
          nullable: true,
          required: [],
          additionalProperties: {
            oneOf: [{ type: "string", enum: ["on", "off"] }, { type: "object" }],
          },
        },
      },
    },
    emitters: {
      type: "object",
      nullable: true,
      required: [],
      additionalProperties: {
        type: "boolean",
      },
    },
  },
};
