import type { CompilerHost, Logger, Tracer } from "../types.js";

export interface CliCompilerHost extends CompilerHost {
  tracer: Tracer;
  logger: Logger;
  debug: boolean;
}
