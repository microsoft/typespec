import type { JSONSchemaType } from "ajv";
import { EmitterOptions, TypeSpecRawConfig } from "./types.js";

export const emitterOptionsSchema: JSONSchemaType<EmitterOptions> = {
  type: "object",
  additionalProperties: true,
  required: [],
  properties: {
    "emitter-output-dir": { type: "string", nullable: true } as any,
  },
};

export const TypeSpecConfigJsonSchema: JSONSchemaType<TypeSpecRawConfig> = {
  type: "object",
  additionalProperties: false,
  properties: {
    extends: {
      type: "string",
      nullable: true,
    },
    "environment-variables": {
      type: "object",
      nullable: true,
      required: [],
      additionalProperties: {
        type: "object",
        properties: {
          default: { type: "string" },
        },
        required: ["default"],
        additionalProperties: false,
      },
    },
    parameters: {
      type: "object",
      nullable: true,
      required: [],
      additionalProperties: {
        type: "object",
        properties: {
          default: { type: "string" },
        },
        required: ["default"],
        additionalProperties: false,
      },
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
    } as any, // Issue with AJV optional property typing https://github.com/ajv-validator/ajv/issues/1664
    imports: {
      type: "array",
      nullable: true,
      items: { type: "string" },
    },
    emit: {
      type: "array",
      nullable: true,
      items: { type: "string" },
    },
    options: {
      type: "object",
      nullable: true,
      required: [],
      additionalProperties: emitterOptionsSchema,
    },
    linter: {
      type: "object",
      nullable: true,
      required: [],
      additionalProperties: false,
      properties: {
        extends: {
          type: "array",
          nullable: true,
          items: { type: "string" },
        },
        enable: {
          type: "object",
          required: [],
          nullable: true,
          additionalProperties: { type: "boolean" },
        },
        disable: {
          type: "object",
          required: [],
          nullable: true,
          additionalProperties: { type: "string" },
        },
      },
    } as any, // ajv type system doesn't like the string templates
  },
};
