import { createModule } from "@alloy-js/python";

/**
 * Descriptor for the `corehttp` runtime package (the unbranded equivalent of
 * `azure-core`). Only the symbols this renderer references are listed;
 * additional symbols should be added as needed.
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
  },
});

/**
 * Descriptor for the `azure.core` runtime package (used when the SDK flavor is
 * azure). Wired up but not yet meaningfully different from `corehttp`;
 * reserved for Azure-specific behavior in a later slice.
 */
export const azureCoreModule = createModule({
  name: "azure.core",
  descriptor: {
    ".": ["PipelineClient", "AsyncPipelineClient"],
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
export function getRuntimeModule(flavor: "unbranded" | "azure") {
  return flavor === "azure" ? azureCoreModule : coreHttpModule;
}
