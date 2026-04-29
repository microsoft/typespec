import type { Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { SCCSet, type NestedArray, type SCCComponent } from "@typespec/emitter-framework";
import {
  MutationEngine,
  MutationHalfEdge,
  MutationNode,
  type MutationInfo,
} from "@typespec/mutator-framework";
import {
  getJsonCodecRegistry,
  IdentityCodec,
  type Codec,
  type CodecRegistry,
  type EncodingInfo,
} from "./codecs.js";
import {
  CANONICALIZATION_CLASSES,
  type HttpCanonicalization,
  type HttpCanonicalizationMutations,
} from "./http-canonicalization-classes.js";
import { HttpCanonicalizationOptions, type HttpCanonicalizationOptionsInit } from "./options.js";

/**
 * A predicate that tests canonicalizations in a subgraph and caches the result.
 */
export abstract class CanonicalizationPredicate {
  /**
   * Unique identifier for the predicate, used for caching results.
   */
  abstract readonly id: string;

  /**
   * Tests whether a canonicalization satisfies this predicate.
   * @param canonicalization The canonicalization to test.
   * @returns True if the canonicalization satisfies the predicate.
   */
  abstract test(canonicalization: HttpCanonicalization): boolean;

  /**
   * Cache of computed results keyed by HttpCanonicalization.
   */
  readonly #cache = new WeakMap<HttpCanonicalization, boolean>();

  /**
   * Gets the cached result for a canonicalization, if available.
   */
  getCached(canonicalization: HttpCanonicalization): boolean | undefined {
    return this.#cache.get(canonicalization);
  }

  /**
   * Sets the cached result for a canonicalization.
   */
  setCached(canonicalization: HttpCanonicalization, result: boolean): void {
    this.#cache.set(canonicalization, result);
  }
}

/**
 * A predicate that tests whether a canonicalization uses the identity codec (no transformation).
 */
export class IdentityCodecPredicate extends CanonicalizationPredicate {
  readonly id = "identity";

  test(canonicalization: HttpCanonicalization): boolean {
    const codec = canonicalization.codec;
    return !codec || codec instanceof IdentityCodec || codec.id === "identity";
  }
}

/**
 * Pre-built predicate for testing identity codec usage.
 */
export const identityCodecPredicate = new IdentityCodecPredicate();

export interface HttpCanonicalizationCommon {
  /**
   * Codec responsible for transforming the scalar into language and wire types.
   */
  codec: Codec | null;

  /**
   * Whether the source type for this type is declared in TypeSpec.
   */
  isDeclaration: boolean;

  /**
   * The language mutation node for this canonicalization.
   */
  get languageMutationNode(): MutationNode<Type>;

  /**
   * The wire mutation node for this canonicalization.
   */
  get wireMutationNode(): MutationNode<Type>;

  /**
   * The possibly mutated language type for this literal.
   */
  get languageType(): Type;

  /**
   * The possibly mutated wire type for this literal.
   */
  get wireType(): Type;
}

export class HttpCanonicalizer extends MutationEngine<HttpCanonicalizationMutations> {
  codecs: CodecRegistry;

  constructor($: Typekit, codecs: CodecRegistry = getJsonCodecRegistry($)) {
    super($, CANONICALIZATION_CLASSES);
    this.codecs = codecs;
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

  /**
   * Tests whether the subgraph rooted at the given canonicalization satisfies
   * the provided predicate. Results are cached on the predicate instance.
   *
   * @param canonicalization The root canonicalization to test.
   * @param predicate The predicate to test against canonicalizations in the subgraph.
   * @returns True if all canonicalizations in the subgraph satisfy the predicate.
   */
  subgraphMatchesPredicate(
    canonicalization: HttpCanonicalization,
    predicate: CanonicalizationPredicate,
  ): boolean {
    const cached = predicate.getCached(canonicalization);
    if (cached !== undefined) {
      return cached;
    }

    const set = new SCCSet<HttpCanonicalization>(httpCanonicalizationDependencyConnector, {
      includeReachable: true,
    });
    set.add(canonicalization);

    const componentResults = new Map<SCCComponent<HttpCanonicalization>, boolean>();

    for (const component of set.components) {
      const members = this.#componentMembers(component);
      if (members.length === 0) {
        continue;
      }

      const existingValue = this.#getExistingComponentResult(members, predicate);
      if (existingValue !== undefined) {
        componentResults.set(component, existingValue);
        continue;
      }

      const result = this.#evaluateComponentPredicate(
        component,
        members,
        componentResults,
        predicate,
      );
      for (const member of members) {
        predicate.setCached(member, result);
      }
      componentResults.set(component, result);
    }

    return predicate.getCached(canonicalization) ?? false;
  }

  /**
   * Tests whether the subgraph rooted at the given canonicalization uses only
   * the identity codec (no transformation).
   *
   * @param canonicalization The root canonicalization to test.
   * @returns True if all codecs in the subgraph are identity codecs.
   */
  subgraphUsesIdentityCodec(canonicalization: HttpCanonicalization): boolean {
    return this.subgraphMatchesPredicate(canonicalization, identityCodecPredicate);
  }

  #evaluateComponentPredicate(
    component: SCCComponent<HttpCanonicalization>,
    members: HttpCanonicalization[],
    componentResults: Map<SCCComponent<HttpCanonicalization>, boolean>,
    predicate: CanonicalizationPredicate,
  ): boolean {
    for (const member of members) {
      if (!predicate.test(member)) {
        return false;
      }
    }

    for (const dependency of component.references) {
      const dependencyValue =
        componentResults.get(dependency) ??
        this.#getExistingComponentResult(this.#componentMembers(dependency), predicate);
      if (dependencyValue === undefined) {
        throw new Error("Dependency predicate state missing before evaluation.");
      }

      if (!dependencyValue) {
        return false;
      }
    }

    return true;
  }

  #componentMembers(component: SCCComponent<HttpCanonicalization>): HttpCanonicalization[] {
    return this.#flattenComponent(component.value);
  }

  #getExistingComponentResult(
    members: HttpCanonicalization[],
    predicate: CanonicalizationPredicate,
  ): boolean | undefined {
    if (members.length === 0) {
      return undefined;
    }
    const firstValue = predicate.getCached(members[0]);
    if (firstValue === undefined) {
      return undefined;
    }
    for (const member of members) {
      if (predicate.getCached(member) !== firstValue) {
        throw new Error("Inconsistent predicate state detected within a component.");
      }
    }
    return firstValue;
  }

  #flattenComponent(value: NestedArray<HttpCanonicalization>): HttpCanonicalization[] {
    if (Array.isArray(value)) {
      return (value as HttpCanonicalization[][]).flat(Infinity) as HttpCanonicalization[];
    }
    return [value];
  }
}

export interface HttpCanonicalizationInfo extends MutationInfo {
  encodingInfo?: EncodingInfo;
}

/**
 * Enumerates the canonicalizations referenced by the provided HTTP canonicalization.
 * This can be supplied directly to an `SCCSet` connector to keep canonicalizations
 * ordered by their dependency graph.
 */
export function* httpCanonicalizationDependencyConnector(
  canonicalization: HttpCanonicalization,
): IterableIterator<HttpCanonicalization> {
  switch (canonicalization.kind) {
    case "Operation": {
      if (canonicalization.parameters) {
        yield assertDependencyDefined(
          canonicalization.parameters as HttpCanonicalization | undefined,
          canonicalization,
          "parameters",
        );
      }
      if (canonicalization.returnType) {
        yield assertDependencyDefined(
          canonicalization.returnType as HttpCanonicalization | undefined,
          canonicalization,
          "returnType",
        );
      }
      break;
    }
    case "Model": {
      if (canonicalization.baseModel) {
        yield assertDependencyDefined(
          canonicalization.baseModel as HttpCanonicalization | undefined,
          canonicalization,
          "baseModel",
        );
      }
      for (const property of canonicalization.properties.values()) {
        if (!property.isVisible) {
          return;
        }
        yield assertDependencyDefined(
          property as HttpCanonicalization | undefined,
          canonicalization,
          "property",
        );
      }
      if (canonicalization.indexer && canonicalization.indexer.value) {
        yield assertDependencyDefined(
          canonicalization.indexer.value as HttpCanonicalization | undefined,
          canonicalization,
          "indexer.value",
        );
      }
      break;
    }
    case "ModelProperty": {
      yield assertDependencyDefined(
        canonicalization.type as HttpCanonicalization | undefined,
        canonicalization,
        "type",
      );
      break;
    }
    case "Scalar": {
      if (canonicalization.baseScalar) {
        yield assertDependencyDefined(
          canonicalization.baseScalar as HttpCanonicalization | undefined,
          canonicalization,
          "baseScalar",
        );
      }
      break;
    }
    case "Union": {
      for (const variant of canonicalization.variants.values()) {
        yield assertDependencyDefined(
          variant as HttpCanonicalization | undefined,
          canonicalization,
          "variant",
        );
      }
      break;
    }
    case "UnionVariant": {
      yield assertDependencyDefined(
        canonicalization.type as HttpCanonicalization | undefined,
        canonicalization,
        "type",
      );
      break;
    }
    case "Enum": {
      for (const member of canonicalization.members.values()) {
        yield assertDependencyDefined(
          member as HttpCanonicalization | undefined,
          canonicalization,
          "member",
        );
      }
      break;
    }
    case "EnumMember":
    case "Intrinsic":
    case "Literal":
      break;
    default: {
      const _exhaustiveCheck: never = canonicalization;
      void _exhaustiveCheck;
      break;
    }
  }
}

function assertDependencyDefined(
  dependency: HttpCanonicalization | undefined,
  canonicalization: HttpCanonicalization,
  path: string,
): HttpCanonicalization {
  if (dependency === undefined) {
    /* eslint-disable-next-line no-console */
    console.error("Undefined HTTP canonicalization dependency.", {
      canonicalization,
      path,
    });
    throw new Error(`HTTP canonicalization dependency "${path}" resolved to undefined.`);
  }
  return dependency;
}
