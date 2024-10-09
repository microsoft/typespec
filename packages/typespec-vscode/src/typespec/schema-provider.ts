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
        logger.debug("can't provide TypeSpecConfigJsonSchema when LSP client is undefined");
        return undefined;
      } else {
        const getSchemaMethod: ServerOnRequestMethodName = "typespec/getTypespecConfigSchema";
        this.typeSpecConfigJsonSchema = await this.client.sendRequest(getSchemaMethod);
        if (!this.typeSpecConfigJsonSchema) {
          logger.debug("Failed to get TypeSpec config schema from server");
          return undefined;
        }
        // the emitters field has been deprecated but not marked in compiler yet
        // so we mark it here to avoid showing it in the completion list when user using older compiler
        if (this.typeSpecConfigJsonSchema.properties?.emitters) {
          this.typeSpecConfigJsonSchema.properties.emitters.deprecated = true;
        }
      }
    }
    return this.typeSpecConfigJsonSchema;
  }

  setTypeSpecConfigJsonSchema(schema: ObjectJSONSchemaType) {
    this.typeSpecConfigJsonSchema = schema;
  }

  async getTypeSpecEmitterConfigJsonSchema(): Promise<ObjectJSONSchemaType | undefined> {
    const schema = await this.getTypeSpecConfigJsonSchema();
    return schema?.properties?.options?.additionalProperties;
  }
}

const schemaProvider = new SchemaProvider();
export default schemaProvider;
