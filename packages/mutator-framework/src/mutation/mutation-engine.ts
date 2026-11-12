import type { MemberType, Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { mutationNodeFor, type MutationNodeForType } from "../mutation-node/factory.js";
import { MutationNode, type MutationNodeOptions } from "../mutation-node/mutation-node.js";
import { EnumMemberMutation } from "./enum-member.js";
import { EnumMutation } from "./enum.js";
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

/** Associates compiler type kinds with mutation instance types, not constructors. */
export type MutationRegistry = Record<Type["kind"], Mutation<Type, any, any>>;

/** Built-in traversal strategy types used for kinds not customized by a consumer. */
export interface DefaultMutationClasses<
  TCustomMutations extends CustomMutationClasses,
> extends MutationRegistry {
  /** Traverses the parameter model and return type of an operation. */
  Operation: OperationMutation<MutationOptions, TCustomMutations>;
  /** Traverses operations belonging to an interface. */
  Interface: InterfaceMutation<MutationOptions, TCustomMutations>;
  /** Traverses a model's base, properties, and indexer. */
  Model: ModelMutation<TCustomMutations, MutationOptions>;
  /** Traverses a scalar's base scalar, when present. */
  Scalar: ScalarMutation<MutationOptions, TCustomMutations>;
  /** Resolves a property's reference chain to its underlying type. */
  ModelProperty: ModelPropertyMutation<TCustomMutations, MutationOptions>;
  /** Traverses the variants declared by a union. */
  Union: UnionMutation<MutationOptions, TCustomMutations>;
  /** Resolves a variant's reference chain to its underlying type. */
  UnionVariant: UnionVariantMutation<MutationOptions, TCustomMutations>;
  /** Traverses the members declared by an enum. */
  Enum: EnumMutation<MutationOptions, TCustomMutations>;
  /** Leaf strategy for an enum member. */
  EnumMember: EnumMemberMutation<MutationOptions, TCustomMutations>;
  /** Leaf strategy for a string literal. */
  String: LiteralMutation<MutationOptions, TCustomMutations>;
  /** Leaf strategy for a numeric literal. */
  Number: LiteralMutation<MutationOptions, TCustomMutations>;
  /** Leaf strategy for a boolean literal. */
  Boolean: LiteralMutation<MutationOptions, TCustomMutations>;
  /** Leaf strategy for compiler intrinsic types such as `null` and `never`. */
  Intrinsic: IntrinsicMutation<MutationOptions, TCustomMutations>;
}

/** Consumer-supplied mutation instance types for any subset of compiler kinds. */
export type CustomMutationClasses = Partial<MutationRegistry>;

/** Combines custom strategy types with the built-in strategy map for typed lookup. */
export type WithDefaultMutations<TCustomMutationClasses extends CustomMutationClasses> =
  TCustomMutationClasses & DefaultMutationClasses<TCustomMutationClasses>;

/** Resolves the mutation instance type returned for a compiler type kind. */
export type MutationFor<
  TCustomMutations extends CustomMutationClasses,
  TKind extends Type["kind"] = Type["kind"],
> = WithDefaultMutations<TCustomMutations>[TKind];

/** Constructor producing an instance of `T`, with arguments supplied by the caller. */
export type Constructor<T = object> = new (...args: any[]) => T;
/** Converts an instance-type registry to the constructors accepted by an engine. */
export type ConstructorsFor<T> = { [K in keyof T]: Constructor<T[K]> };
/** Recovers instance types from a registry of mutation constructors. */
export type InstancesFor<T extends Record<string, new (...args: any[]) => any>> = {
  [K in keyof T]: InstanceType<T[K]>;
};

/** Inputs describing a mutation before its cache key has been selected. */
export interface InitialMutationContext<
  TSourceType extends Type,
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions = MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> {
  /** Engine used to resolve related mutations. */
  engine: TEngine;
  /** Type being traversed, before any node-level transformation. */
  sourceType: TSourceType;
  /** Member reference chain, ordered from the outermost reference inward. */
  referenceTypes: MemberType[];
  /** Consumer configuration used to select and execute the strategy. */
  options: TOptions;
}

/** Cache identity added after selecting a mutation for a source type. */
export interface CreateMutationContext {
  /** Key distinguishing strategies for the same source type. */
  mutationKey: string;
}

/**
 * Mutation inputs together with the selected cache identity.
 * Describes the combined context; constructors receive these values positionally.
 */
export interface MutationContext<
  TSourceType extends Type,
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions = MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
>
  extends
    InitialMutationContext<TSourceType, TCustomMutations, TOptions, TEngine>,
    CreateMutationContext {}

/** Additional metadata supplied when resolving a mutation. */
export interface MutationTraits {
  /** Indicates a type introduced by a transformation, propagated through mutation info. */
  isSynthetic?: boolean;
}

/**
 * Orchestrates type mutations using custom and default mutation classes.
 */
export class MutationEngine<TCustomMutations extends CustomMutationClasses> {
  /** TypeSpec type utilities. */
  $: Typekit;

  // Map of Type -> (Map of options.cacheKey() -> Mutation)
  #mutationCache = new Map<Type, Map<string, MutationFor<TCustomMutations>>>();
  #seenMutationNodes = new WeakMap<Type, Map<string, MutationNode<Type>>>();
  #mutatorClasses: ConstructorsFor<MutationRegistry>;

  /**
   * Creates a mutation engine with optional custom mutation classes.
   * @param $ - TypeSpec type utilities
   * @param mutatorClasses - Custom mutation class constructors
   */
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
      Enum: mutatorClasses.Enum ?? EnumMutation,
      EnumMember: mutatorClasses.EnumMember ?? EnumMemberMutation,
      String: mutatorClasses.String ?? LiteralMutation,
      Number: mutatorClasses.Number ?? LiteralMutation,
      Boolean: mutatorClasses.Boolean ?? LiteralMutation,
      StringTemplate: (mutatorClasses as any).StringTemplate ?? LiteralMutation,
      Tuple: (mutatorClasses as any).Tuple ?? LiteralMutation,
      Intrinsic: mutatorClasses.Intrinsic ?? IntrinsicMutation,
    } as any;
  }

  /**
   * Gets or creates a mutation node for the given type and key.
   *
   * Nodes are shared by source type identity and key, independently of strategy
   * caching. Options only affect a node when it is first created.
   * @param type - Source type
   * @param options - Node metadata or a key string; the default key is empty
   * @returns Mutation node for the type
   */
  getMutationNode<T extends Type>(
    type: T,
    options?: MutationNodeOptions | string,
  ): MutationNodeForType<T> {
    let keyMap = this.#seenMutationNodes.get(type);
    const mutationKey = typeof options === "string" ? options : (options?.mutationKey ?? "");
    if (keyMap) {
      const existingNode = keyMap.get(mutationKey);
      if (existingNode) {
        return existingNode as MutationNodeForType<T>;
      }
    } else {
      keyMap = new Map();
      this.#seenMutationNodes.set(type, keyMap);
    }

    const node = mutationNodeFor(this, type, options);
    keyMap.set(mutationKey, node);
    return node;
  }

  /**
   * Replaces one mutation node with another in the cache.
   * @param oldNode - Node to remove
   * @param newNode - Node to add
   */
  replaceMutationNode(oldNode: MutationNode<Type>, newNode: MutationNode<Type>) {
    const oldKeyMap = this.#seenMutationNodes.get(oldNode.sourceType);
    if (oldKeyMap) {
      oldKeyMap.delete(oldNode.mutationKey);
    }

    let newKeyMap = this.#seenMutationNodes.get(newNode.sourceType);
    if (!newKeyMap) {
      newKeyMap = new Map();
      this.#seenMutationNodes.set(newNode.sourceType, newKeyMap);
    }
    newKeyMap.set(newNode.mutationKey, newNode);
  }

  /**
   * Replaces a reference with a new type and mutates it.
   *
   * Most often called either:
   * - from inside a member mutation's `mutate()` with the member's own "type"
   *   half-edge, which accepts any `Type` (no wrapping needed); or
   * - from inside a member mutation's static `mutationInfo` with the parent's
   *   member-yielding half-edge (e.g. a `Model`'s `startPropertyEdge`).
   *
   * In the latter case, if `newType.kind` does not match the slot the
   * half-edge fills (declared via `halfEdge.expectedTailKind`), `newType` is
   * wrapped in a synthetic member (a `ModelProperty` or `UnionVariant` named
   * after the original `reference`) so the parent's slot remains kind-correct.
   * The synthetic's normal mutation flow then mutates `newType` recursively
   * through its own "type" edge.
   *
   * @param reference - Original reference to replace
   * @param newType - New type to use
   * @param options - Mutation options
   * @param halfEdge - Optional half edge for tracking
   * @returns Mutation for the new type, or for the synthetic member wrapping it
   */
  replaceAndMutateReference<TType extends Type>(
    reference: MemberType,
    newType: TType,
    options: MutationOptions = new MutationOptions(),
    halfEdge?: MutationHalfEdge,
  ) {
    const expected = halfEdge?.expectedTailKind;
    if (expected && expected !== newType.kind) {
      const synthetic = this.#createSyntheticMember(expected, reference, newType);
      if (synthetic) {
        return this.mutateWorker(synthetic, [], options, halfEdge, {
          isSynthetic: true,
        }) as any;
      }
    }

    const { references } = resolveReference(reference);
    const mut = this.mutateWorker(newType, references, options, halfEdge, {
      isSynthetic: true,
    });
    return mut;
  }

  /**
   * Builds a synthetic member of `expectedKind` named after `reference` and
   * with its `.type` slot pointing at `newType`. Returns `undefined` if the
   * expected kind cannot be wrapped as a member, leaving the caller to fall
   * back to the default behavior.
   */
  #createSyntheticMember(
    expectedKind: Type["kind"],
    reference: MemberType,
    newType: Type,
  ): MemberType | undefined {
    if (expectedKind === "ModelProperty" && reference.kind === "ModelProperty") {
      return this.$.modelProperty.create({
        name: reference.name,
        type: newType,
        optional: reference.optional,
      });
    }
    if (expectedKind === "UnionVariant" && reference.kind === "UnionVariant") {
      return this.$.unionVariant.create({
        name: typeof reference.name === "string" ? reference.name : undefined,
        type: newType,
      });
    }
    return undefined;
  }

  /**
   * Internal worker that creates or retrieves mutations with caching.
   */
  protected mutateWorker<TType extends Type>(
    type: TType,
    references: MemberType[],
    options: MutationOptions,
    halfEdge?: MutationHalfEdge,
    traits?: MutationTraits,
  ): MutationFor<TCustomMutations, TType["kind"]> {
    // initialize cache
    if (!this.#mutationCache.has(type)) {
      this.#mutationCache.set(type, new Map<string, MutationFor<TCustomMutations, Type["kind"]>>());
    }

    const byType = this.#mutationCache.get(type)!;
    const mutatorClass = this.#mutatorClasses[type.kind];
    if (!mutatorClass) {
      throw new Error("No mutator registered for type kind: " + type.kind);
    }

    const info = (mutatorClass as any).mutationInfo(
      this,
      type,
      references,
      options,
      halfEdge,
      traits,
    );
    if (info instanceof Mutation) {
      // Already a mutation, return it directly.
      // Type change mutations break types badly, but hopefully in general things "just work"?
      return info as any;
    }

    const key = info.mutationKey;
    if (byType.has(key)) {
      const existing = byType.get(key)! as any;
      halfEdge?.setTail(existing);
      if (!existing.isMutated) {
        existing.isMutated = true;
        existing.mutate();
      }
      return existing;
    }

    // TS doesn't like this abstract class here, but it will be a derivative
    // class in practice.
    const mutation = new (mutatorClass as any)(this, type, [], options, info);
    byType.set(key, mutation);
    mutation.isMutated = true;
    halfEdge?.setTail(mutation);
    mutation.mutate();
    return mutation;
  }

  /**
   * Mutates a type using registered mutation classes.
   * @param type - Type to mutate
   * @param options - Mutation options
   * @param halfEdge - Optional half edge for linking mutations to parent mutations
   * @returns Mutation for the type
   */
  mutate<TType extends Type>(
    type: TType,
    options: MutationOptions = new MutationOptions(),
    halfEdge?: MutationHalfEdge,
    traits?: MutationTraits,
  ): MutationFor<TCustomMutations, TType["kind"]> {
    return this.mutateWorker(type, [], options, halfEdge, traits);
  }

  /**
   * Mutates a type through a reference chain (e.g., ModelProperty or UnionVariant).
   * @param reference - Reference to mutate
   * @param options - Mutation options
   * @param halfEdge - Optional half edge for tracking
   * @returns Mutation for the referenced type
   */
  mutateReference(
    reference: MemberType,
    options: MutationOptions = new MutationOptions(),
    halfEdge?: MutationHalfEdge,
    traits?: MutationTraits,
  ): MutationFor<TCustomMutations> {
    const { referencedType, references } = resolveReference(reference);

    return this.mutateWorker(referencedType, references, options, halfEdge, traits) as any;
  }
}

function resolveReference(reference: MemberType) {
  const references: MemberType[] = [];
  let referencedType: Type = reference;
  while (referencedType.kind === "ModelProperty" || referencedType.kind === "UnionVariant") {
    references.push(referencedType);
    referencedType = referencedType.type;
  }
  return {
    referencedType,
    references,
  };
}

/**
 * Configuration shared with related mutations during traversal.
 * Derive from this class to carry custom options and distinguish their cache keys.
 */
export class MutationOptions {
  /**
   * Cache key used by the default {@link Mutation.mutationInfo} implementation.
   * The empty default shares one strategy per source type. Include all options
   * that affect a transformation when overriding this getter.
   */
  get mutationKey(): string {
    return "";
  }
}

/**
 * Half-edge used to link mutations together. This represents the head-end of a
 * mutation. When the tail is created, it is set on the half-edge and allows the
 * head mutation to connect its nodes to the tail mutation.
 *
 * `expectedTailKind` declares the kind of `Mutation` the head expects on the
 * other end. The engine uses this so that, when `replaceAndMutateReference` is
 * given a `newType` whose kind does not match the slot the half-edge fills
 * (e.g. a parent `Model` whose `"property"` slot is being substituted with a
 * `Model` instead of a `ModelProperty`), it can wrap the replacement in a
 * synthetic member of the expected kind, preserving the parent's contract.
 *
 * Leaving `expectedTailKind` undefined means the half-edge accepts any
 * `Mutation` kind (e.g. the `"type"` slot of a `ModelProperty`).
 */
export class MutationHalfEdge<
  THead extends Mutation<any, any> = any,
  TTail extends Mutation<any, any> = any,
> {
  /** Strategy that initiated this relationship. */
  head: THead;
  /** Resolved related strategy, or `undefined` until {@link setTail} is called. */
  tail: TTail | undefined;
  /** Relationship label chosen by the head, such as `"property"` or `"type"`. */
  readonly kind: string;
  /** Expected member slot kind for synthetic wrapping, or any kind when absent. */
  readonly expectedTailKind?: Type["kind"];
  #onTailCreation: (tail: TTail) => void;

  /**
   * Creates a deferred strategy connection.
   * `onTailCreation` connects the strategies' nodes when the engine resolves a tail.
   */
  constructor(
    kind: string,
    head: THead,
    onTailCreation: (tail: TTail) => void,
    expectedTailKind?: Type["kind"],
  ) {
    this.kind = kind;
    this.head = head;
    this.#onTailCreation = onTailCreation;
    this.expectedTailKind = expectedTailKind;
  }

  /** Stores the resolved strategy and invokes the connection callback immediately. */
  setTail(tail: TTail) {
    this.tail = tail;
    this.#onTailCreation(tail);
  }
}
