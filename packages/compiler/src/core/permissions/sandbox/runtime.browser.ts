// Browser stub for the sandbox runtime. OS-level sandboxed execution relies on
// Node built-ins (`child_process`, `fs`) and is never used in the browser, so
// these are inert and throw if somehow invoked.

const message = "Sandboxed execution is not supported in the browser.";

export function runInSandbox(): Promise<never> {
  return Promise.reject(new Error(message));
}

export function resolveRealpath(path: string): string {
  return path;
}
