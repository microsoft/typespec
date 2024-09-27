import type { JSONSchemaType, ServerOnRequestMethodName } from "@typespec/compiler";
import { LanguageClient } from "vscode-languageclient/node.js";
import logger from "../extension-logger.js";

let typeSpecConfigJsonSchema: JSONSchemaType<unknown> | undefined;
export async function getTypeSpecConfigJsonSchema(
  client: LanguageClient | undefined,
): Promise<JSONSchemaType<unknown> | undefined> {
  if (!typeSpecConfigJsonSchema) {
    if (!client) {
      return undefined;
    }
    const getSchemaMethod: ServerOnRequestMethodName = "typespec/getTypespecConfigSchema";
    typeSpecConfigJsonSchema = await client.sendRequest(getSchemaMethod);
    if (!typeSpecConfigJsonSchema) {
      logger.debug("Failed to get TypeSpec config schema from server.");
      return undefined;
    }
    // the emitters field has been deprecated but not marked in compiler yet
    // so we mark it here to avoid showing it in the completion list when user using older compiler
    if (typeSpecConfigJsonSchema.properties?.emitters) {
      typeSpecConfigJsonSchema.properties.emitters.deprecated = true;
    }
  }
  return typeSpecConfigJsonSchema;
}

export async function getTypeSpecEmitterConfigJsonSchema(
  client: LanguageClient | undefined,
): Promise<JSONSchemaType<unknown> | undefined> {
  const schema = await getTypeSpecConfigJsonSchema(client);
  return schema?.properties?.options?.additionalProperties;
}
