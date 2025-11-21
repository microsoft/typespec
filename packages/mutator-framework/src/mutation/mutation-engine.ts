import type { MemberType, Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import type { MutationNodeForType } from "../mutation-node/factory.js";
import { MutationSubgraph } from "../mutation-node/mutation-subgraph.js";
import { InterfaceMutation } from "./interface.js";
import { IntrinsicMutation } from "./intrinsic.js";
import { LiteralMutation } from "./literal.js";
import { ModelPropertyMutation } from "./model-property.js";
import { ModelMutation } from "./model.js";
import { Mutation } from "./mutation.js";
import { OperationMutation } from "./operation.js";
import { ScalarMutation } from "./scalar.js";
import { UnionVariantMutation } from "./union-variant.js";
import { UnionMutation } from "./union.js";

export type MutationRegistry = Record<Type["kind"], Mutation<Type, any, any>>;

export interface DefaultMutationClasses<TCustomMutations extends CustomMutationClasses>
  extends MutationRegistry {
  Operation: OperationMutation<MutationOptions, TCustomMutations>;
  Interface: InterfaceMutation<MutationOptions, TCustomMutations>;
  Model: ModelMutation<MutationOptions, TCustomMutations>;
  Scalar: ScalarMutation<MutationOptions, TCustomMutations>;
  ModelProperty: ModelPropertyMutation<MutationOptions, TCustomMutations>;
  Union: UnionMutation<MutationOptions, TCustomMutations>;
  UnionVariant: UnionVariantMutation<MutationOptions, TCustomMutations>;
  String: LiteralMutation<MutationOptions, TCustomMutations>;
  Number: LiteralMutation<MutationOptions, TCustomMutations>;
  Boolean: LiteralMutation<MutationOptions, TCustomMutations>;
  Intrinsic: IntrinsicMutation<MutationOptions, TCustomMutations>;
}

export type CustomMutationClasses = Partial<MutationRegistry>;

export type WithDefaultMutations<TCustomMutationClasses extends CustomMutationClasses> =
  TCustomMutationClasses & DefaultMutationClasses<TCustomMutationClasses>;

export type MutationFor<
  TCustomMutations extends CustomMutationClasses,
  TKind extends Type["kind"] = Type["kind"],
> = WithDefaultMutations<TCustomMutations>[TKind];

export type Constructor<T = object> = new (...args: any[]) => T;
export type ConstructorsFor<T> = { [K in keyof T]: Constructor<T[K]> };
export type InstancesFor<T extends Record<string, new (...args: any[]) => any>> = {
  [K in keyof T]: InstanceType<T[K]>;
};

export class MutationEngine<TCustomMutations extends CustomMutationClasses> {
  $: Typekit;

  // Map of Type -> (Map of options.cacheKey() -> Mutation)
  #mutationCache = new Map<Type, Map<string, MutationFor<TCustomMutations>>>();

  // Map of MemberType -> (Map of options.cacheKey() -> Mutation)
  #referenceMutationCache = new Map<MemberType, Map<string, MutationFor<TCustomMutations>>>();

  #subgraphNames = new Set<string>();

  // Map of subgraph names -> (Map of options.cacheKey() -> MutationSubgraph)
  #subgraphs = new Map<string, Map<string, MutationSubgraph>>();

  #mutatorClasses: MutationRegistry;

  constructor($: Typekit, mutatorClasses: ConstructorsFor<TCustomMutations>) {
    this.$ = $;
    this.#mutatorClasses = {
      Operation: mutatorClasses.Operation ?? OperationMutation,
      Interface: mutatorClasses.Interface ?? InterfaceMutation,
      Model: mutatorClasses.Model ?? ModelMutation,
      Scalar: mutatorClasses.Scalar ?? ScalarMutation,
      ModelProperty: mutatorClasses.ModelProperty ?? ModelPropertyMutation,
      Union: mutatorClasses.Union ?? UnionMutation,
      UnionVariant: mutatorClasses.UnionVariant ?? UnionVariantMutation,
      String: mutatorClasses.String ?? LiteralMutation,
      Number: mutatorClasses.Number ?? LiteralMutation,
      Boolean: mutatorClasses.Boolean ?? LiteralMutation,
      Intrinsic: mutatorClasses.Intrinsic ?? IntrinsicMutation,
    } as any;
  }

  protected registerSubgraph(name: string) {
    this.#subgraphNames.add(name);
  }

  protected getMutationSubgraph(options: MutationOptions, name?: string) {
    const optionsKey = options?.cacheKey() ?? "default";
    if (!this.#subgraphs.has(optionsKey)) {
      this.#subgraphs.set(optionsKey, new Map());
    }
    const subgraphsForOptions = this.#subgraphs.get(optionsKey)!;

    name = name ?? "default";
    if (!subgraphsForOptions.has(name)) {
      subgraphsForOptions.set(name, new MutationSubgraph(this));
    }

    return subgraphsForOptions.get(name)!;
  }

  getDefaultMutationSubgraph(options?: MutationOptions): MutationSubgraph {
    throw new Error("This mutation engine does not provide a default mutation subgraph.");
  }

  /**
   * Retrieve the mutated type from the default mutation subgraph for the given options.
   */
  getMutatedType<T extends Type>(options: MutationOptions, sourceType: T): T;
  /**
   * Retrieve the mutated type from a specific mutation subgraph.
   */
  getMutatedType<T extends Type>(subgraph: MutationSubgraph, sourceType: T): T;
  /**
   * Retrieve the mutated type from either the default subgraph with the given
   * options or a specific subgraph.
   */
  getMutatedType<T extends Type>(
    subgraphOrOptions: MutationOptions | MutationSubgraph,
    sourceType: T,
  ): T;
  getMutatedType<T extends Type>(
    subgraphOrOptions: MutationOptions | MutationSubgraph,
    sourceType: T,
  ) {
    if (subgraphOrOptions instanceof MutationOptions) {
      return this.getMutationNode(subgraphOrOptions, sourceType).mutatedType;
    }
    return this.getMutationNode(subgraphOrOptions, sourceType).mutatedType;
  }

  /**
   * Get (and potentially create) the mutation node for the provided type in the default subgraph.
   */
  getMutationNode<T extends Type>(options: MutationOptions, type: T): MutationNodeForType<T>;
  /**
   * Get (and potentially create) the mutation node for the provided type in a specific subgraph.
   */
  getMutationNode<T extends Type>(subgraph: MutationSubgraph, type: T): MutationNodeForType<T>;

  /**
   * Get (and potentially create) the mutation node for the provided type in
   * either the default subgraph with the given options or a specific subgraph.
   */
  getMutationNode<T extends Type>(
    subgraphOrOptions: MutationOptions | MutationSubgraph,
    type: T,
  ): MutationNodeForType<T>;
  getMutationNode<T extends Type>(subgraphOrOptions: MutationOptions | MutationSubgraph, type: T) {
    let subgraph: MutationSubgraph;
    if (subgraphOrOptions instanceof MutationOptions) {
      subgraph = this.getDefaultMutationSubgraph(subgraphOrOptions);
    } else {
      subgraph = subgraphOrOptions;
    }
    return subgraph.getNode(type);
  }

  mutateType<T extends Type>(
    subgraphOrOptions: MutationOptions | MutationSubgraph,
    type: T,
    initializeMutation: (type: T) => void,
  ) {
    const subgraph = this.#getSubgraphFromOptions(subgraphOrOptions);
    this.getMutationNode(subgraph, type).mutate(initializeMutation as (type: Type) => void);
  }

  #getSubgraphFromOptions(subgraphOrOptions: MutationOptions | MutationSubgraph) {
    if (subgraphOrOptions instanceof MutationOptions) {
      return this.getDefaultMutationSubgraph(subgraphOrOptions);
    } else {
      return subgraphOrOptions;
    }
  }

  mutate<TType extends Type>(
    type: TType,
    options: MutationOptions = new MutationOptions(),
  ): MutationFor<TCustomMutations, TType["kind"]> {
    if (!this.#mutationCache.has(type)) {
      this.#mutationCache.set(type, new Map<string, MutationFor<TCustomMutations, Type["kind"]>>());
    }

    const byType = this.#mutationCache.get(type)!;
    const key = options.cacheKey();
    if (byType.has(key)) {
      const existing = byType.get(key)! as any;
      if (!existing.isMutated) {
        existing.isMutated = true;
        existing.mutate();
      }
      return existing;
    }

    this.#initializeSubgraphs(type, options);

    const mutatorClass = this.#mutatorClasses[type.kind];
    if (!mutatorClass) {
      throw new Error("No mutator registered for type kind: " + type.kind);
    }

    // TS doesn't like this abstract class here, but it will be a derivative
    // class in practice.
    const mutation = new (mutatorClass as any)(this, type, [], options);

    byType.set(key, mutation);
    mutation.isMutated = true;
    mutation.mutate();
    return mutation;
  }

  mutateReference<TType extends MemberType>(
    memberType: TType,
    referencedMutationNode: Type,
    options: MutationOptions,
  ): MutationFor<TCustomMutations>;
  mutateReference<TType extends MemberType>(
    memberType: TType,
    options: MutationOptions,
  ): MutationFor<TCustomMutations>;
  mutateReference<TType extends MemberType>(
    memberType: TType,
    referencedMutationNodeOrOptions: Type | MutationOptions,
    options?: MutationOptions,
  ): MutationFor<TCustomMutations> {
    let referencedMutationNode: Type | undefined;
    let finalOptions: MutationOptions;
    if (referencedMutationNodeOrOptions instanceof MutationOptions) {
      finalOptions = referencedMutationNodeOrOptions;
      referencedMutationNode = undefined;
    } else {
      referencedMutationNode = referencedMutationNodeOrOptions as Type;
      finalOptions = options!;
    }

    if (!this.#referenceMutationCache.has(memberType)) {
      this.#referenceMutationCache.set(
        memberType,
        new Map<string, MutationFor<TCustomMutations>>(),
      );
    }

    const byType = this.#referenceMutationCache.get(memberType)!;
    const key = finalOptions.cacheKey();
    if (byType.has(key)) {
      const existing = byType.get(key)! as any;
      if (!existing.isMutated) {
        existing.isMutated = true;
        existing.mutate();
      }
      return existing;
    }

    this.#initializeSubgraphs(memberType, finalOptions);
    const sources: MemberType[] = [];

    let referencedType: Type = memberType;
    while (referencedType.kind === "ModelProperty" || referencedType.kind === "UnionVariant") {
      sources.push(referencedType);
      referencedType = referencedType.type;
    }

    const typeToMutate = referencedMutationNode ?? referencedType;
    const mutatorClass = this.#mutatorClasses[typeToMutate.kind];
    if (!mutatorClass) {
      throw new Error("No mutator registered for type kind: " + typeToMutate.kind);
    }

    const mutation = new (mutatorClass as any)(this, typeToMutate, sources, finalOptions);

    byType.set(key, mutation);
    mutation.isMutated = true;
    mutation.mutate();
    return mutation;
  }

  #initializeSubgraphs(root: Type, options: MutationOptions) {
    for (const name of this.#subgraphNames) {
      const subgraph = this.getMutationSubgraph(options, name);
      subgraph.getNode(root);
    }
  }
}

export class MutationOptions {
  cacheKey(): string {
    return "";
  }
}
