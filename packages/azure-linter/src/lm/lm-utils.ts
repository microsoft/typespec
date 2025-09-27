import { DiagnosticMessages, DiagnosticTarget, LinterRuleContext } from "@typespec/compiler";
import { ChatCompleteOptions, ChatMessage } from "@typespec/compiler/experimental";
import { join } from "path";
import z, { ZodObject } from "zod";
import { logger } from "../log/logger.js";
import { toJsonSchemaString, tryRepairAndParseJson } from "../utils.js";
import { lmCache } from "./lm-cache.js";
import { getLmProvider } from "./providers/lm-provider.js";
import {
  LmDiagnosticMessages,
  LmErrorMessages,
  LmResponseContent,
  LmResponseError,
  zLmResponseError,
} from "./types.js";

const skipReportingDiagnosticsWhenLmProviderNotAvailable = true;

export function reportLmErrors<T extends LmDiagnosticMessages>(
  result: LmResponseError,
  target: DiagnosticTarget,
  context: LinterRuleContext<T>,
  onOtherErrors: (r: LmResponseError, context: LinterRuleContext<T>) => void,
) {
  if (result.type !== "error") {
    return;
  }
  switch (result.error) {
    case LmErrorMessages.LanguageModelProviderNotAvailable:
      // the template constraint should have already ensured the 'lmProviderNotAvailable' messageId is available
      // but the tsc compiler still complains about it. so convert as any here to avoid the error. Same for following cases
      // TODO: further investigation needed to figure out a way to let compiler know the messageId is available
      if (!skipReportingDiagnosticsWhenLmProviderNotAvailable) {
        context.reportDiagnostic({
          target,
          messageId: "lmProviderNotAvailable",
        } as any);
      }
      break;
    case LmErrorMessages.EmptyLmResponse:
      context.reportDiagnostic({
        target,
        messageId: "emptyLmResponse",
      } as any);
      break;
    case LmErrorMessages.FailedToParseMappingResult:
      context.reportDiagnostic({
        target,
        messageId: "failedToParseMappingResult",
      } as any);
      break;
    default:
      onOtherErrors(result, context);
  }
}

export async function askLanguageModeWithRetry<
  T extends ZodObject<any, any, any, LmResponseContent>,
  P extends DiagnosticMessages,
>(
  context: LinterRuleContext<P>,
  callerKey: string,
  messages: ChatMessage[],
  options: ChatCompleteOptions,
  responseZod: T,
  retryCount = 3,
): Promise<z.infer<T> | LmResponseError> {
  let result;
  for (let attempt = 0; attempt < retryCount; attempt++) {
    result = await askLanguageModel(context, callerKey, messages, options, responseZod);
    if (
      result.type === "error" &&
      (result.error === LmErrorMessages.LanguageModelProviderNotAvailable ||
        result.error === LmErrorMessages.EmptyLmResponse ||
        result.error === LmErrorMessages.FailedToParseMappingResult)
    ) {
      logger.error(
        `Error while asking language model (attempt ${attempt + 1}/${retryCount}): ${result.error}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return result;
    // sleep for a short time before retrying
  }
  logger.error("All attempts to ask the language model failed");
  return result!;
}

export async function askLanguageModel<
  T extends ZodObject<any, any, any, LmResponseContent>,
  P extends DiagnosticMessages,
>(
  context: LinterRuleContext<P>,
  callerKey: string,
  messages: ChatMessage[],
  options: ChatCompleteOptions,
  responseZod: T,
): Promise<z.infer<T> | LmResponseError> {
  const cachePath = join(context.program.projectRoot, "azure-linter-lm.cache");
  await lmCache.init(cachePath);
  if (callerKey) {
    const fromCache = await lmCache.getForMsg<z.infer<T>>(callerKey, messages);
    if (fromCache) {
      logger.debug("Using cached result for messages: " + JSON.stringify(messages));
      return fromCache;
    }
  }
  // check the provider here to make sure cache is checked first which should work even when the provider is not available
  const provider = getLmProvider();
  if (!provider) {
    logger.error("Language model provider is not available");
    return createLmErrorResponse(LmErrorMessages.LanguageModelProviderNotAvailable);
  }

  const responseSchemaMessage = `
  ** Important: You response MUST follow the RULEs below **
  - If there is error occures, you MUST reponse a valid JSON object that matches the schema: 
  \`\`\`json schema
  ${toJsonSchemaString(zLmResponseError)}
  \`\`\`
  - If there is no error occurs, you MUST response a valid JSON object or array that matches the schema: 
  \`\`\`json schema
  ${toJsonSchemaString(responseZod)}
  \`\`\`
  - There MUST NOT be any other text in the response, only the JSON object or array.
  - The JSON object or array MUST NOT be wrapped in triple backticks or any other formatting.
  - DOUBLE CHECK the JSON object or array before sending it back to ensure it is valid, follows the schema and all the required fields are filled properly.
`;
  const msgToLm: ChatMessage[] = [
    ...messages,
    {
      role: "user",
      message: responseSchemaMessage,
    },
  ];

  try {
    const result = await provider.chatComplete(msgToLm, options);
    if (!result) {
      logger.error("No result returned from language model.");
      return createLmErrorResponse(LmErrorMessages.EmptyLmResponse);
    }
    const parsedResult = tryParseLanguageModelResult(result, responseZod);
    if (parsedResult === undefined) {
      logger.error("Failed to parse mapping result from LLM: " + result);
      return createLmErrorResponse(LmErrorMessages.FailedToParseMappingResult);
    }

    if (callerKey && parsedResult.type !== "error") {
      // Cache the result if it is a valid response
      void lmCache.setForMsg(callerKey, messages, parsedResult);
    }

    return parsedResult;
  } catch (error) {
    logger.error(`Error while asking language model: ${error}`);
    return createLmErrorResponse(`Error while asking language model: ${error}`);
  }
}

export function createLmErrorResponse(errorMessage: string): LmResponseError {
  return {
    type: "error",
    error: errorMessage,
  };
}

export function tryParseLanguageModelResult<T extends LmResponseContent>(
  text: string | undefined,
  responseZod: ZodObject<any, any, any, T>,
): T | LmResponseError | undefined {
  if (!text) {
    logger.error("No text provided for parsing result");
    return undefined;
  }

  const jsonString = getJsonPart(text);

  const jsonObj = tryRepairAndParseJson(jsonString) as T | LmResponseError | undefined;
  if (!jsonObj || !jsonObj.type) {
    logger.error(`Invalid response from LM which is not a valid LmResponseBasic: ${text}`);
    return undefined;
  }
  if (jsonObj.type === "error") {
    const result = zLmResponseError.safeParse(jsonObj);
    if (result.success) {
      return result.data;
    } else {
      logger.error(`Invalid error response from LM: ${text}`);
      return undefined;
    }
  } else if (jsonObj.type === "content") {
    const result = responseZod.safeParse(jsonObj);
    if (result.success) {
      return result.data;
    } else {
      logger.error(`Invalid content response from LM: ${text}`);
      return undefined;
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger.error(
      `Invalid response type: ${(jsonObj as any).type}. Expected 'error' or 'content'. Response: ${text}`,
    );
    return undefined;
  }
}

/** in case AI wrap the json with some text, try to have some simple handling for that */
function getJsonPart(text: string): string {
  // Find the first opening bracket/brace
  const openBracket = text.indexOf("[");
  const openBrace = text.indexOf("{");
  const startIndex =
    openBracket === -1
      ? openBrace
      : openBrace === -1
        ? openBracket
        : Math.min(openBracket, openBrace);

  if (startIndex === -1) {
    return text;
  }

  // Determine if we're looking for array or object based on which came first
  const isArray = text[startIndex] === "[";
  const closeChar = isArray ? "]" : "}";
  const endIndex = text.lastIndexOf(closeChar);

  if (endIndex === -1) {
    return text;
  }

  return text.substring(startIndex, endIndex + 1);
}
