import type { MemberType, Type } from "@typespec/compiler";
import type { MutationNodeForType } from "../mutation-node/factory.js";
import type { MutationSubgraph } from "../mutation-node/mutation-subgraph.js";
import type { CustomMutationClasses, MutationEngine, MutationOptions } from "./mutation-engine.js";

export abstract class Mutation<
  TSourceType extends Type,
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions = MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> {
  abstract readonly kind: string;

  static readonly subgraphNames: string[] = [];

  engine: TEngine;
  sourceType: TSourceType;
  options: TOptions;
  isMutated: boolean = false;
  referenceTypes: MemberType[];

  constructor(
    engine: TEngine,
    sourceType: TSourceType,
    referenceTypes: MemberType[],
    options: TOptions,
  ) {
    this.engine = engine;
    this.sourceType = sourceType;
    this.options = options;
    this.referenceTypes = referenceTypes;
  }

  abstract mutate(): void;

  /**
   * Retrieve the mutated type for this mutation's default subgraph.
   */
  protected getMutatedType(): TSourceType;
  /**
   * Retrieve the mutated type for the provided subgraph.
   */
  protected getMutatedType(subgraph: MutationSubgraph): TSourceType;
  protected getMutatedType(subgraphOrOptions?: MutationSubgraph | MutationOptions) {
    return this.engine.getMutatedType(subgraphOrOptions ?? this.options, this.sourceType);
  }

  /**
   * Retrieve the mutation node for this mutation's default subgraph.
   */
  protected getMutationNode(): MutationNodeForType<TSourceType>;
  /**
   * Retrieve the mutation node for the provided subgraph.
   */
  protected getMutationNode(subgraph: MutationSubgraph): MutationNodeForType<TSourceType>;
  /**
   * Retrieve the mutation node for either the default subgraph with the given
   * options or a specific subgraph.
   */
  protected getMutationNode(
    subgraphOrOptions: MutationSubgraph | MutationOptions,
  ): MutationNodeForType<TSourceType>;
  protected getMutationNode(subgraphOrOptions?: MutationSubgraph | MutationOptions) {
    return this.engine.getMutationNode(subgraphOrOptions ?? this.options, this.sourceType);
  }

  /**
   * Mutate this type in the default subgraph.
   */
  protected mutateType(initializeMutation?: (type: TSourceType) => void): void;
  /**
   * Mutate this type in the given subgraph
   */
  protected mutateType(
    subgraph: MutationSubgraph,
    initializeMutation?: (type: TSourceType) => void,
  ): void;

  protected mutateType(
    subgraphOrInit?: MutationSubgraph | ((type: TSourceType) => void),
    initializeMutation?: (type: TSourceType) => void,
  ) {
    if (typeof subgraphOrInit === "function") {
      initializeMutation = subgraphOrInit;
      subgraphOrInit = undefined;
    }
    const node = this.getMutationNode(subgraphOrInit ?? this.options);
    node.mutate(initializeMutation as (type: Type) => void);
  }
}
