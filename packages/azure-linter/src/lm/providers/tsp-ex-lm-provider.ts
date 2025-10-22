import { ChatCompleteOptions, ChatMessage, LmProvider } from "@typespec/compiler/experimental";
import { logger } from "../../log/logger.js";

type TspExLmProviderConnectionString = {
  type: "TspExLmProvider";
};

function isTspExLmProviderConnectionString(
  connectionString: Record<string, string>,
): connectionString is TspExLmProviderConnectionString {
  return connectionString.type === "TspExLmProvider";
}

export class TspExLmProvider implements LmProvider {
  private constructor(private tspExLmProvider: LmProvider) {}

  static create(connectionString: Record<string, string>): TspExLmProvider | undefined {
    if (!isTspExLmProviderConnectionString(connectionString)) {
      return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = (globalThis as any).TspExLmProvider;
    if (!r || typeof r.chatComplete !== "function") {
      logger.debug(`Default TspExLmProvider not found`);
      return undefined;
    }
    return new TspExLmProvider(r);
  }

  chatComplete(messages: ChatMessage[], options: ChatCompleteOptions): Promise<string> {
    if (!this.tspExLmProvider || typeof this.tspExLmProvider.chatComplete !== "function") {
      throw new Error("TspExLmProvider is not available or does not have chatComplete method");
    }
    return this.tspExLmProvider.chatComplete(messages, options);
  }
}
