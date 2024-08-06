import { JSONSchemaType } from "ajv";
import { CadlRanchConfig } from "./types.js";

export const CadlRanchConfigJsonSchema: JSONSchemaType<CadlRanchConfig> = {
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
