import { Document } from "yaml";
import { SourceFile } from "../core/types.js";

export interface YamlScript {
  readonly kind: "yaml-script";
  readonly file: SourceFile;
  /** Value of the yaml script. */
  readonly value: unknown;

  /** @internal yaml library document. We do not expose this as the "yaml" library is not part of the contract. */
  readonly doc: Document.Parsed;
}

/**
 * Diagnostic target pointing to a specific yaml node.
 */
export interface YamlDiagnosticTarget {
  /** Yaml script */
  readonly file: YamlScript;
  /** Path to the target node from the root of the document. */
  readonly path: string[];
  /** If targeting the value or the key in the case of a map. */
  readonly kind: YamlDiagnosticTargetType;
}

export type YamlDiagnosticTargetType = "value" | "key";
