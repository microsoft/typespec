import type { MemberType, Type } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationHalfEdge,
  MutationOptions,
  MutationTraits,
} from "./mutation-engine.js";

/**
 * Cache identity and metadata returned by {@link Mutation.mutationInfo}.
 * Custom fields are passed to the mutation constructor along with these fields.
 */
export interface MutationInfo extends Record<string, unknown> {
  /** Distinguishes mutations of the same source type within an engine. */
  mutationKey: string;
  /** Marks a type introduced by a transformation rather than the original graph. */
  isSynthetic?: boolean;
}

/**
 * Traversal and transformation strategy for one source type.
 *
 * The engine caches strategies by source type identity and mutation key before
 * calling {@link mutate}, allowing recursive types to reuse an in-progress
 * strategy. A strategy is distinct from the mutation nodes it may create.
 */
export abstract class Mutation<
  TSourceType extends Type,
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions = MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> {
  /** Identifies the type kind handled by this strategy. */
  abstract readonly kind: string;

  /** Optional strategy metadata; the base engine does not consult these names. */
  static readonly subgraphNames: string[] = [];

  protected engine: TEngine;
  /** Input to this strategy, not the resulting type in the parallel graph. */
  sourceType: TSourceType;
  protected options: TOptions;
  /**
   * Whether the engine has started this strategy's traversal.
   * Set before calling {@link mutate}; does not indicate that a node was cloned.
   */
  isMutated: boolean = false;
  protected referenceTypes: MemberType[];
  protected mutationInfo: MutationInfo;

  /** Initializes a strategy with the engine's selected cache metadata and options. */
  constructor(
    engine: TEngine,
    sourceType: TSourceType,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    this.engine = engine;
    this.sourceType = sourceType;
    this.options = options;
    this.referenceTypes = referenceTypes;
    this.mutationInfo = info;
  }

  /** Engine responsible for resolving related types and sharing mutation nodes. */
  get mutationEngine(): TEngine {
    return this.engine;
  }

  /**
   * Selects a cache key before the engine looks up or constructs a strategy.
   *
   * The default uses `options.mutationKey` and preserves the synthetic trait.
   * Override to use the reference chain (outermost member first) in the key, or
   * return an existing mutation to substitute a different traversal. When
   * returning a mutation, the override is responsible for connecting `halfEdge`.
   */
  static mutationInfo(
    engine: MutationEngine<any>,
    sourceType: Type,
    referenceTypes: MemberType[],
    options: MutationOptions,
    halfEdge?: MutationHalfEdge,
    traits?: MutationTraits,
  ): MutationInfo | Mutation<any, any, any, any> {
    return {
      mutationKey: options.mutationKey,
      isSynthetic: traits?.isSynthetic,
    };
  }
  /**
   * Traverses related source types and applies this strategy's transformations.
   * The engine invokes this once per cached strategy, including recursive graphs.
   */
  abstract mutate(): void;
}
