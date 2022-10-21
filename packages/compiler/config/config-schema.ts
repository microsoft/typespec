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
    "output-dir": {
      type: "string",
      nullable: true,
    },
    "warn-as-error": {
      type: "boolean",
      nullable: true,
    },
    trace: {
      oneOf: [
        { type: "string" },
        {
          type: "array",
          items: { type: "string" },
        },
      ],
    } as any,
    imports: {
      type: "array",
      nullable: true,
      items: { type: "string" },
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
