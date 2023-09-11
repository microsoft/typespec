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

export type YamlDiagnosticTargetType = "value" | "key";
