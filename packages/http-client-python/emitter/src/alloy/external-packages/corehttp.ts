import { createModule } from "@alloy-js/python";

/**
 * Descriptor for the `corehttp` runtime package, the unbranded equivalent of
 * `azure-core`. We expose only the symbols this emitter currently references;
 * additional symbols should be added as needed when new features are wired up.
 */
export const coreHttpModule = createModule({
  name: "corehttp",
  descriptor: {
    runtime: ["PipelineClient", "AsyncPipelineClient"],
    rest: ["HttpRequest", "HttpResponse", "AsyncHttpResponse"],
    exceptions: ["HttpResponseError"],
    credentials: ["TokenCredential", "AsyncTokenCredential", "AzureKeyCredential"],
    polling: [
      "LROPoller",
      "AsyncLROPoller",
      "LROBasePolling",
      "AsyncLROBasePolling",
      "PollingMethod",
      "AsyncPollingMethod",
      "NoPolling",
      "AsyncNoPolling",
    ],
    utils: ["CaseInsensitiveEnumMeta"],
  },
});

/**
 * Descriptor for the `azure.core` runtime package (used when `flavor: azure`).
 */
export const azureCoreModule = createModule({
  name: "azure.core",
  descriptor: {
    ".": ["PipelineClient", "AsyncPipelineClient", "CaseInsensitiveEnumMeta"],
    rest: ["HttpRequest", "HttpResponse", "AsyncHttpResponse"],
    exceptions: ["HttpResponseError"],
    credentials: ["TokenCredential", "AzureKeyCredential"],
    polling: [
      "LROPoller",
      "AsyncLROPoller",
      "LROBasePolling",
      "AsyncLROBasePolling",
      "PollingMethod",
      "AsyncPollingMethod",
      "NoPolling",
      "AsyncNoPolling",
    ],
  },
});

/**
 * Returns the appropriate runtime module for the requested flavor.
 */
export function getRuntimeModule(flavor: string) {
  return flavor === "azure" ? azureCoreModule : coreHttpModule;
}
