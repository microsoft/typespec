// Browser stub for the per-emitter sandbox runner. Sandboxed emitter execution
// requires Node process isolation and is never used in the browser.

export function runEmitterSandboxed(): Promise<never> {
  return Promise.reject(new Error("Sandboxed execution is not supported in the browser."));
}
