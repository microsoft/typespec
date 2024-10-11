import { JSONSchemaType, ServerOnRequestMethodName } from "@typespec/compiler";
import { LanguageClient } from "vscode-languageclient/node.js";
import logger from "../log/logger.js";

export type ObjectJSONSchemaType = JSONSchemaType<object>;

class SchemaProvider {
  private typeSpecConfigJsonSchema: ObjectJSONSchemaType | undefined;
  private client: LanguageClient | undefined;

  constructor() {}

  init(client: LanguageClient) {
    this.client = client;
  }

  async getTypeSpecConfigJsonSchema(): Promise<ObjectJSONSchemaType | undefined> {
    if (!this.typeSpecConfigJsonSchema) {
      if (!this.client) {
        logger.debug("Try to use default TypeSpecConfigJsonSchema when LSP client is undefined");
        return this.defaultTypeSpecConfigJsonSchema;
      } else {
        const getSchemaMethod: ServerOnRequestMethodName = "typespec/getTypeSpecConfigJsonSchema";
        try {
          this.typeSpecConfigJsonSchema = await this.client.sendRequest(getSchemaMethod);
        } catch (e) {
          logger.debug(
            "Unexpected exception when sendRequest to LSP to get schema, try to use default TypeSpecConfigJsonSchema",
            [e],
          );
          return this.defaultTypeSpecConfigJsonSchema;
        }
        if (!this.typeSpecConfigJsonSchema) {
          logger.debug(
            "Try to use default TypeSpecConfigJsonSchema when failing to get TypeSpec config schema from server",
          );
          return this.defaultTypeSpecConfigJsonSchema;
        }
        // the emitters field has been deprecated but not marked in compiler yet
        // so we mark it here to avoid showing it in the completion list when user's using older compiler
        if (this.typeSpecConfigJsonSchema.properties?.emitters) {
          this.typeSpecConfigJsonSchema.properties.emitters.deprecated = true;
        }
      }
    }
    return this.typeSpecConfigJsonSchema;
  }

  async getTypeSpecEmitterConfigJsonSchema(): Promise<ObjectJSONSchemaType | undefined> {
    const schema = await this.getTypeSpecConfigJsonSchema();
    return schema?.properties?.options?.additionalProperties;
  }

  // copied from packages/compiler/src/config/config-schema.ts to provide "default" emitter config schema when the compiler is too old to provide schema through LSP
  private defaultEmitterOptionsSchema: JSONSchemaType<object> = {
    type: "object",
    additionalProperties: true,
    required: [],
    properties: {
      "emitter-output-dir": { type: "string", nullable: true } as any,
    },
  };

  // copied from packages/compiler/src/config/config-schema.ts to provide "default" TypeSpec config schema when the compiler is too old to provide schema through LSP
  private defaultTypeSpecConfigJsonSchema: JSONSchemaType<object> = {
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
        additionalProperties: this.defaultEmitterOptionsSchema,
      },
      emitters: {
        type: "object",
        nullable: true,
        deprecated: true,
        required: [],
        additionalProperties: {
          oneOf: [{ type: "boolean" }, this.defaultEmitterOptionsSchema],
        },
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
}

const schemaProvider = new SchemaProvider();
export default schemaProvider;
