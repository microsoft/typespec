import { inspect } from "util";
import { LanguageModelChat, LanguageModelChatMessage, lm } from "vscode";
import { ENABLE_LM_LOGGING } from "../const";
import logger, { LogItem } from "../log/logger";
import { RetryResult, runWithRetry, runWithTimingLog } from "../utils";

const lmModelCache = new Map<string, Thenable<LanguageModelChat[]>>();
let lmParallelRequestCount = 0;

export async function sendLmChatRequest(
  messages: { role: "user" | "assist"; message: string }[],
  modelName?: string,
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
  const family = modelName ?? "gpt-5";
  lmLog({ level: "debug", message: `Model family used: ${family}` });
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
            let mp = lmModelCache.get(family);
            if (!mp) {
              mp = lm.selectChatModels({ family });
              lmModelCache.set(family, mp);
            }
            const m = await mp;
            if (!m || m.length === 0) {
              lmModelCache.delete(family);
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
      message: `[ChatComplete #${id ?? "N/A"}] Error when selecting chat models for family ${family}`,
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
        const response = await models[0].sendRequest(
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
