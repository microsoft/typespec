import { DiagnosticMessages } from "@typespec/compiler";
import z from "zod";

export const zLmResponseContent = z.object({
  type: z
    .literal("content")
    .describe("Type of the response, sub types should override this with a literal type"),
});

export type LmResponseContent = z.infer<typeof zLmResponseContent>;

export const zLmResponseError = zLmResponseContent.merge(
  z.object({
    type: z.literal("error"),
    error: z.string().describe("Error message from the language model provider"),
  }),
);

export type LmResponseError = z.infer<typeof zLmResponseError>;

export const ENV_VAR_LM_PROVIDER_CONNECTION_STRING = "LM_PROVIDER_CONNECTION_STRING";

export enum LmErrorMessages {
  LanguageModelProviderNotAvailable = `Language Model is not available. If you are in VSCode, please make sure TypeSpec extension has been installed and VSCode LM has been initialized which may take some time if you just start the VSCode. If you are outside of VSCode, please make sure the environment variable ${ENV_VAR_LM_PROVIDER_CONNECTION_STRING} is set properly.`,
  EmptyLmResponse = "Empty response got from Language Model, please check whether the language model is available and retry again.",
  FailedToParseMappingResult = "Failed to parse mapping result from Language model, please retry",
}

export interface LmDiagnosticMessages extends DiagnosticMessages {
  lmProviderNotAvailable: string;
  emptyLmResponse: string;
  failedToParseMappingResult: string;
}

export const LmDiagnosticMessages: LmDiagnosticMessages = {
  lmProviderNotAvailable: LmErrorMessages.LanguageModelProviderNotAvailable,
  emptyLmResponse: LmErrorMessages.EmptyLmResponse,
  failedToParseMappingResult: LmErrorMessages.FailedToParseMappingResult,
};

export enum LmFamily {
  claudeSonnet4 = "claude-sonnet-4",
  gpt4o = "gpt-4o",
  o4Mini = "o4-mini",
  gpt5mini = "gpt-5-mini",
}

export const defaultLmFamily = LmFamily.gpt4o;
