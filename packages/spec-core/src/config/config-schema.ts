import { JSONSchemaType } from "ajv";
import { SpecConfig } from "./types.js";

export const SpecConfigJsonSchema: JSONSchemaType<SpecConfig> = {
  type: "object",
  additionalProperties: false,
  properties: {
    unsupportedScenarios: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: [],
} as const;
