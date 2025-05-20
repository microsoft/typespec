import { TspLanguageClient } from "./tsp-language-client";

export let tspLanguageClient: TspLanguageClient | undefined;

export function setTspLanguageClient(newTspLanguageClient: TspLanguageClient | undefined) {
  tspLanguageClient = newTspLanguageClient;
}
