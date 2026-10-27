import { Visibility } from "@typespec/http";
import { MutationOptions } from "@typespec/mutator-framework";
import type { HttpCanonicalization } from "./http-canonicalization-classes.js";

/** Serialization position, including whether a structured parameter uses URI-template `*` expansion. */
export type HttpCanonicalizationLocation =
  "header" | "header-explode" | "query" | "query-explode" | "path" | "path-explode" | "body";

/** Context for deriving a type's HTTP representations; omitted fields use constructor defaults. */
export interface HttpCanonicalizationOptionsInit {
  /** Lifecycle visibility to apply; defaults to `Visibility.All`. */
  visibility?: Visibility;
  /** Serialization position passed to nested canonicalizations; defaults to `"body"`. */
  location?: HttpCanonicalizationLocation;
  /** Media-type context for transforms such as JSON nullability; defaults to `"none"`. */
  contentType?: string;
  /**
   * Optional naming callback retained in the options. Current canonicalizations
   * do not invoke it automatically; it is not part of the mutation cache key.
   */
  namePolicy?: (canonicalization: HttpCanonicalization) => string | undefined;
}
/**
 * Resolved, mutable HTTP context shared with a canonicalization. Establish options
 * before using them as cache inputs; use {@link with} to derive a separate context.
 */
export class HttpCanonicalizationOptions extends MutationOptions {
  /** Active lifecycle visibility; initially `Visibility.All` unless supplied. */
  visibility: Visibility;
  /** Active serialization position; initially `"body"` unless supplied. */
  location: HttpCanonicalizationLocation;
  /** Active media-type context; `"none"` means no media type was supplied. */
  contentType: string;
  /** Retained naming hook; not automatically invoked or included in {@link mutationKey}. */
  namePolicy?: (canonicalization: HttpCanonicalization) => string | undefined;

  /** Resolves absent fields to all visibility, body location, and no media-type context. */
  constructor(options: HttpCanonicalizationOptionsInit = {}) {
    super();
    this.visibility = options.visibility ?? Visibility.All;
    this.location = options.location ?? "body";
    this.contentType = options.contentType ?? "none";
    this.namePolicy = options.namePolicy;
  }

  /** Cache identity derived only from visibility, location, and content type, not naming policy. */
  get mutationKey(): string {
    return `visibility:${this.visibility}|location:${this.location}|contentType:${this.contentType}`;
  }

  /**
   * Creates a new context without modifying this one. Omitted or undefined fields
   * retain their current values, so `undefined` cannot clear an existing naming hook.
   */
  with(newOptions: Partial<HttpCanonicalizationOptionsInit>): HttpCanonicalizationOptions {
    return new HttpCanonicalizationOptions({
      visibility: newOptions.visibility ?? this.visibility,
      location: newOptions.location ?? this.location,
      contentType: newOptions.contentType ?? this.contentType,
      namePolicy: newOptions.namePolicy ?? this.namePolicy,
    });
  }
}
