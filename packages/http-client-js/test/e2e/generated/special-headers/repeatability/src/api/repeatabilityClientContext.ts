import { Client, ClientOptions, getClient } from "@typespec/ts-http-runtime";

export interface RepeatabilityClientContext extends Client {

}export interface RepeatabilityClientOptions extends ClientOptions {
  endpoint?: string;
}export function createRepeatabilityClientContext(
  options?: RepeatabilityClientOptions,): RepeatabilityClientContext {
  const params: Record<string, any> = {
    endpoint: options?.endpoint ?? "http://localhost:3000"
  };
  const resolvedEndpoint = "{endpoint}".replace(/{([^}]+)}/g, (_, key) =>
    key in params ? String(params[key]) : (() => { throw new Error(`Missing parameter: ${key}`); })()
  );;return getClient(resolvedEndpoint,{
    allowInsecureConnection: true,
    retryOptions: {
      maxRetries: 1,
    },...options,
  })
}