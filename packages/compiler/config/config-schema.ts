import { JSONSchemaType } from "ajv";
import { CadlRawConfig } from "./types.js";

export const CadlConfigJsonSchema: JSONSchemaType<CadlRawConfig> = {
  type: "object",
  additionalProperties: false,
  properties: {
    extends: {
      type: "string",
      nullable: true,
    },
    emitters: {
      type: "object",
      nullable: true,
      required: [],
      additionalProperties: {
        oneOf: [{ type: "boolean" }, { type: "object" }],
      },
    },
  },
};
