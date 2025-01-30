import { Client, ClientOptions, KeyCredential, getClient } from "@typespec/ts-http-runtime";

export interface AttachmentsClientContext extends Client {}
export interface AttachmentsClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createAttachmentsClientContext(
  endpoint: string,
  credential: KeyCredential,
  options?: AttachmentsClientOptions,
): AttachmentsClientContext {
  return getClient(endpoint, credential, {
    ...options,
    credentials: {
      apiKeyHeaderName: "Authorization",
    },
  });
}
