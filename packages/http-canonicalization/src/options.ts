import type { Type } from "@typespec/compiler";
import { Visibility } from "@typespec/http";
import { MutationOptions } from "@typespec/mutator-framework";
import type { HttpCanonicalization } from "./http-canonicalization-classes.js";

export type HttpCanonicalizationLocation =
  | "header"
  | "header-explode"
  | "query"
  | "query-explode"
  | "path"
  | "path-explode"
  | "body";

export interface HttpCanonicalizationOptionsInit {
  visibility?: Visibility;
  location?: HttpCanonicalizationLocation;
  contentType?: string;
  namePolicy?: (canonicalization: HttpCanonicalization) => string | undefined;
  /**
   * When set, the language-subgraph type edge for a model property follows this
   * type instead of the source property's type. The wire-subgraph edge always
   * follows the source property's original type.
   *
   * This is the mechanism that enables `@alternateType` support: callers (e.g.
   * TCGC) look up the alternate type for a property and pass it here so the
   * language representation uses the alternate type while serialization still
   * uses the original wire type.
   */
  alternateType?: Type;
}
export class HttpCanonicalizationOptions extends MutationOptions {
  visibility: Visibility;
  location: HttpCanonicalizationLocation;
  contentType: string;
  namePolicy?: (canonicalization: HttpCanonicalization) => string | undefined;
  alternateType?: Type;

  constructor(options: HttpCanonicalizationOptionsInit = {}) {
    super();
    this.visibility = options.visibility ?? Visibility.All;
    this.location = options.location ?? "body";
    this.contentType = options.contentType ?? "none";
    this.namePolicy = options.namePolicy;
    this.alternateType = options.alternateType;
  }

  get mutationKey(): string {
    return `visibility:${this.visibility}|location:${this.location}|contentType:${this.contentType}`;
  }

  with(newOptions: Partial<HttpCanonicalizationOptionsInit>): HttpCanonicalizationOptions {
    return new HttpCanonicalizationOptions({
      visibility: newOptions.visibility ?? this.visibility,
      location: newOptions.location ?? this.location,
      contentType: newOptions.contentType ?? this.contentType,
      namePolicy: newOptions.namePolicy ?? this.namePolicy,
      alternateType: newOptions.alternateType ?? this.alternateType,
    });
  }
}
