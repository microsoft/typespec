import type { Document } from "yaml";
import type { SourceFile } from "../core/types.js";

/** Parsed YAML input with its original source file and resulting JavaScript value. */
export interface YamlScript {
  /** Discriminant identifying a parsed YAML script. */
  readonly kind: "yaml-script";
  /** Original text and path used to locate diagnostics in the YAML input. */
  readonly file: SourceFile;
  /** Value of the yaml script. */
  readonly value: unknown;

  /** @internal yaml library document. We do not expose this as the "yaml" library is not part of the contract. */
  readonly doc: Document.Parsed;
}

/**
 * Represent the location of a value in a yaml script.
 */
export interface YamlPathTarget {
  kind: "path-target";
  script: YamlScript;
  path: string[];
}
export type YamlDiagnosticTargetType = "value" | "key";
