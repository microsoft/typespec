import { CompilerHost, CompilerOptions, NodePackage, TypeSpecLibrary } from "@typespec/compiler";

export interface PlaygroundSample {
  filename: string;
  preferredEmitter?: string;
  content: string;

  /**
   * Compiler options for the sample.
   */
  compilerOptions?: CompilerOptions;
}

export interface PlaygroundTspLibrary {
  name: string;
  packageJson: NodePackage;
  isEmitter: boolean;
  definition?: TypeSpecLibrary<any>;
}

export interface BrowserHost extends CompilerHost {
  compiler: typeof import("@typespec/compiler");
  libraries: Record<string, PlaygroundTspLibrary>;
}
