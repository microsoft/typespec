import { CompilerHost, Logger } from "../types.js";

export interface CliCompilerHost extends CompilerHost {
  logger: Logger;
  debug: boolean;
}
