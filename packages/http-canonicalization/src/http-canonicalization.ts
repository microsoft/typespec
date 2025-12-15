import type { Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { MutationEngine, MutationSubgraph } from "@typespec/mutator-framework";
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
    this.registerSubgraph("language");
    this.registerSubgraph("wire");
  }

  getLanguageSubgraph(options: HttpCanonicalizationOptions): MutationSubgraph {
    return this.getMutationSubgraph(options, "language");
  }

  getWireSubgraph(options: HttpCanonicalizationOptions): MutationSubgraph {
    return this.getMutationSubgraph(options, "wire");
  }

  canonicalize<T extends Type>(type: T, options?: HttpCanonicalizationOptionsInit) {
    return this.mutate(type, new HttpCanonicalizationOptions(options));
  }
}
