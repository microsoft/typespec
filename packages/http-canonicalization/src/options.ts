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
}
export class HttpCanonicalizationOptions extends MutationOptions {
  visibility: Visibility;
  location: HttpCanonicalizationLocation;
  contentType: string;
  namePolicy?: (canonicalization: HttpCanonicalization) => string | undefined;

  constructor(options: HttpCanonicalizationOptionsInit = {}) {
    super();
    this.visibility = options.visibility ?? Visibility.All;
    this.location = options.location ?? "body";
    this.contentType = options.contentType ?? "none";
    this.namePolicy = options.namePolicy;
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
    });
  }
}
