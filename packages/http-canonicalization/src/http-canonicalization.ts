import type { Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { MutationEngine, MutationHalfEdge, type MutationInfo } from "@typespec/mutator-framework";
import type { Codec } from "./codecs.js";
import {
  CANONICALIZATION_CLASSES,
  type HttpCanonicalizationMutations,
} from "./http-canonicalization-classes.js";
import { HttpCanonicalizationOptions, type HttpCanonicalizationOptionsInit } from "./options.js";

export interface LanguageMapper {
  getLanguageType(specType: Type): Type;
}

export const TSLanguageMapper: LanguageMapper = {
  getLanguageType(specType: Type): Type {
    // TypeScript emitter handles all the built-in types.
    return specType;
  },
};

export class HttpCanonicalizer extends MutationEngine<HttpCanonicalizationMutations> {
  constructor($: Typekit) {
    super($, CANONICALIZATION_CLASSES);
  }

  canonicalize<T extends Type>(
    type: T,
    options?: HttpCanonicalizationOptionsInit | HttpCanonicalizationOptions,
    edge?: MutationHalfEdge,
  ) {
    return this.mutate(
      type,
      options instanceof HttpCanonicalizationOptions
        ? options
        : new HttpCanonicalizationOptions(options),
      edge,
    );
  }
}

export interface HttpCanonicalizationInfo extends MutationInfo {
  codec: Codec;
}
