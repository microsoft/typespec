import { Document } from "yaml";
import { SourceFile } from "../core/types.js";

export interface YamlScript {
  readonly kind: "yaml-script";
  readonly file: SourceFile;
  /** Value of the yaml script. */
  readonly value: unknown;

  /** @internal */
  readonly doc: Document.Parsed;
}

export interface YamlTarget {
  readonly file: YamlScript;
  readonly path: string[];
  readonly kind: YamlTargetType;
}

export type YamlTargetType = "value" | "key";
