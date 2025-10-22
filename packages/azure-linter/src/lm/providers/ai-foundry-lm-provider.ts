import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { ChatCompleteOptions, ChatMessage, LmProvider } from "@typespec/compiler/experimental";
import { AzureOpenAI } from "openai";
import { logger } from "../../log/logger.js";

type AiFoundryLmProviderConnectionString = {
  type: "AiFoundryLmProvider";
  // only support open ai service for now
  serviceType: "openai";
  endpoint: string;
  apiVersion: string;
  // model deployment name
  deployment: string;
};

function isAiFoundryLmProviderConnectionString(
  connectionString: Record<string, string>,
): connectionString is AiFoundryLmProviderConnectionString {
  return (
    connectionString.type === "AiFoundryLmProvider" &&
    connectionString.serviceType === "openai" &&
    !!connectionString.endpoint &&
    !!connectionString.apiVersion &&
    !!connectionString.deployment
  );
}

export class AiFoundryLmProvider implements LmProvider {
  private constructor(private connectionString: AiFoundryLmProviderConnectionString) {}

  static create(connectionString: Record<string, string>): AiFoundryLmProvider | undefined {
    if (isAiFoundryLmProviderConnectionString(connectionString)) {
      return new AiFoundryLmProvider(connectionString);
    } else {
      return undefined;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async chatComplete(messages: ChatMessage[], options: ChatCompleteOptions): Promise<string> {
    // Initialize the DefaultAzureCredential
    const credential = new DefaultAzureCredential();
    const scope = "https://cognitiveservices.azure.com/.default";
    const azureADTokenProvider = getBearerTokenProvider(credential, scope);

    // Initialize the AzureOpenAI client with Entra ID (Azure AD) authentication
    const client = new AzureOpenAI({
      endpoint: this.connectionString.endpoint,
      azureADTokenProvider,
      apiVersion: this.connectionString.apiVersion,
      deployment: this.connectionString.deployment,
    });

    const result = await client.chat.completions.create({
      messages: messages.map((m) => {
        if (m.role === "user") {
          return { role: "user", content: m.message };
        } else if (m.role === "assist") {
          return { role: "assistant", content: m.message };
        } else {
          logger.error(`Unsupported message role: ${m.role}, default to 'user' role`);
          return { role: "user", content: m.message };
        }
      }),
      // shall we use the options's model? or it's defined by the deployment already? needs to double check
      model: "gpt-4o",
    });

    // take the first choice and return the content to keep things simple
    if (!result.choices || result.choices.length === 0) {
      throw new Error("No choices returned from the chat completion.");
    }
    if (!result.choices[0].message || !result.choices[0].message.content) {
      throw new Error("No content in the first choice's message.");
    }
    // Log the content of the first choice's message
    logger.debug("Chat completion result:", result.choices[0].message.content);
    // Return the content as a string
    return result.choices[0].message.content;
  }
}
