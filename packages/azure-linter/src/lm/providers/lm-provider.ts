import { LmProvider } from "@typespec/compiler/experimental";
import { logger } from "../../log/logger.js";
import { tryParseConnectionString } from "../../utils.js";
import { ENV_VAR_LM_PROVIDER_CONNECTION_STRING } from "../types.js";
import { AiFoundryLmProvider } from "./ai-foundry-lm-provider.js";
import { TspExLmProvider } from "./tsp-ex-lm-provider.js";

let lmProvider: LmProvider | undefined | "not-initialized" = "not-initialized";

/**
 *
 * @param connectionString we will read from environment variable LM_PROVIDER_CONNECTION_STRING if not provided
 * @returns
 */
export function getLmProvider(): LmProvider | undefined {
  if (lmProvider !== "not-initialized") {
    return lmProvider;
  }
  const connectionString = process.env[ENV_VAR_LM_PROVIDER_CONNECTION_STRING];
  if (!connectionString) {
    logger.debug(
      `No LM provider connection string found in environment variable ${ENV_VAR_LM_PROVIDER_CONNECTION_STRING}. Try to use default TspExLmProvider.`,
    );
    const provider = TspExLmProvider.create({ type: "TspExLmProvider" });
    if (!provider) {
      logger.debug("Default TspExLmProvider is not available. Return undefined as lm provider.");
    }
    lmProvider = provider;
    return lmProvider;
  } else {
    const csObj = tryParseConnectionString(connectionString);
    if (!csObj || !csObj.type) {
      logger.error("Invalid connection string: missing 'type' property");
      return undefined;
    }

    const p = TspExLmProvider.create(csObj) || AiFoundryLmProvider.create(csObj);
    if (!p) {
      logger.error(`Failed to create LmProvider from connection string: ${connectionString}`);
      return undefined;
    }
    lmProvider = p;
    return p;
  }
}
