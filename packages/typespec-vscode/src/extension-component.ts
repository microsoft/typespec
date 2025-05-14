import { TspLanguageClient } from "./tsp-language-client";

export let client: TspLanguageClient | undefined;

export function setClient(newClient: TspLanguageClient) {
  client = newClient;
}
