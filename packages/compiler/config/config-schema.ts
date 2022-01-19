import { JSONSchemaType } from "ajv";
import { CadlRawConfig } from "./types.js";

export const CadlConfigJsonSchema: JSONSchemaType<CadlRawConfig> = {
  type: "object",
  additionalProperties: false,
  properties: {
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
