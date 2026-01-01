import { inspect } from "util";
import { LanguageModelChat, LanguageModelChatMessage, lm } from "vscode";
import { ENABLE_LM_LOGGING } from "../const";
import logger, { LogItem } from "../log/logger";
import { RetryResult, runWithRetry, runWithTimingLog } from "../utils";

const lmModelCache = new Map<string, Thenable<LanguageModelChat[]>>();
let lmParallelRequestCount = 0;

export interface LmChatMesage {
  role: "user" | "assist";
  message: string;
}

export interface LmChatRequestOptions {
  modelOptions?: { [name: string]: any };
}

export async function sendLmChatRequest(
  messages: LmChatMesage[],
  modelFamily: string,
  options?: LmChatRequestOptions,
  /** Only for logging purpose */
  id?: string,
): Promise<string | undefined> {
  const logEnabled = process.env[ENABLE_LM_LOGGING] === "true";
  const lmLog = (item: LogItem) => {
    if (logEnabled || item.level === "error" || item.level === "warning") {
      logger.log(
        item.level,
        `[ChatComplete][#${id ?? "N/A"}] ${item.message}`,
        item.details,
        item.options,
      );
    }
  };
  if (modelFamily === undefined || modelFamily.trim() === "") {
    lmLog({ level: "warning", message: `No model family provided for chat completion.` });
    return undefined;
  }
  if (messages === undefined || messages.length === 0) {
    lmLog({ level: "warning", message: `No messages provided for chat completion.` });
    return undefined;
  }

  let models: LanguageModelChat[] | undefined;
  try {
    models = await runWithRetry(
      "Model Selection",
      async () =>
        await runWithTimingLog(
          "Model Selection",
          async () => {
            let mp = lmModelCache.get(modelFamily);
            if (!mp) {
              mp = lm.selectChatModels({ family: modelFamily });
              lmModelCache.set(modelFamily, mp);
            }
            const m = await mp;
            if (!m || m.length === 0) {
              lmModelCache.delete(modelFamily);
              return RetryResult.Failed;
            }
            return m;
          },
          lmLog,
        ),
      lmLog,
    );
  } catch (e) {
    lmLog({
      level: "error",
      message: `Error when selecting chat models for family ${modelFamily}`,
      details: [e],
    });
    return undefined;
  }

  try {
    lmParallelRequestCount++;
    return await runWithTimingLog(
      "Send request to LM",
      async () => {
        lmLog({ level: "debug", message: `LM parallelism increased to ${lmParallelRequestCount}` });
        const selectedModel = models[0];
        lmLog({
          level: "debug",
          message: `Requested model family: ${modelFamily}, selected: ${selectedModel.family}`,
        });

        const response = await selectedModel.sendRequest(
          messages.map((m) => {
            if (m.role === "user") {
              return LanguageModelChatMessage.User(m.message);
            } else if (m.role === "assist") {
              return LanguageModelChatMessage.Assistant(m.message);
            } else {
              logger.debug(`Unknown chat message role: ${m.role}. Default to use User role.`);
              return LanguageModelChatMessage.User(m.message);
            }
          }),
          options,
        );
        let fullResponse = "";
        for await (const chunk of response.text) {
          fullResponse += chunk;
        }
        return fullResponse;
      },
      lmLog,
    );
  } catch (e) {
    lmLog({
      level: "error",
      message: `Error when sending chat completion request to model ${models[0].name}. error: ${inspect(e)}`,
    });
    return undefined;
  } finally {
    lmParallelRequestCount--;
    lmLog({ level: "debug", message: `LM parallelism reduced to ${lmParallelRequestCount}` });
  }
}
