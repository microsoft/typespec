import { Client, ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface AttachmentsClientContext extends Client {}
export interface AttachmentsClientOptions extends ClientOptions {
  endpoint?: string;
}
export function createAttachmentsClientContext(
  endpoint: string,
  options?: AttachmentsClientOptions,
): AttachmentsClientContext {
  return getClient(endpoint, { allowInsecureConnection: true, ...options });
}
