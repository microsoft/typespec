import type { MemberType, Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { mutationNodeFor, type MutationNodeForType } from "../mutation-node/factory.js";
import type { MutationNode } from "../mutation-node/mutation-node.js";
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
  Model: ModelMutation<TCustomMutations, MutationOptions>;
  Scalar: ScalarMutation<MutationOptions, TCustomMutations>;
  ModelProperty: ModelPropertyMutation<TCustomMutations, MutationOptions>;
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

export interface InitialMutationContext<
  TSourceType extends Type,
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions = MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> {
  engine: TEngine;
  sourceType: TSourceType;
  referenceTypes: MemberType[];
  options: TOptions;
}

export interface CreateMutationContext {
  mutationKey: string;
}

export interface MutationContext<
  TSourceType extends Type,
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions = MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends InitialMutationContext<TSourceType, TCustomMutations, TOptions, TEngine>,
    CreateMutationContext {}

export class MutationEngine<TCustomMutations extends CustomMutationClasses> {
  $: Typekit;

  // Map of Type -> (Map of options.cacheKey() -> Mutation)
  #mutationCache = new Map<Type, Map<string, MutationFor<TCustomMutations>>>();
  #seenMutationNodes = new WeakMap<Type, Map<string, MutationNode<Type>>>();
  #mutatorClasses: ConstructorsFor<MutationRegistry>;

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

  getSeenMutation<T extends Type>(
    type: T,
    mutationKey: string,
  ): MutationFor<TCustomMutations, T["kind"]> | undefined {
    const byType = this.#mutationCache.get(type);
    if (byType) {
      return byType.get(mutationKey) as MutationFor<TCustomMutations, T["kind"]> | undefined;
    }
    return undefined;
  }

  getMutationNode<T extends Type>(type: T, mutationKey: string = ""): MutationNodeForType<T> {
    let keyMap = this.#seenMutationNodes.get(type);

    if (keyMap) {
      const existingNode = keyMap.get(mutationKey);
      if (existingNode) {
        return existingNode as MutationNodeForType<T>;
      }
    } else {
      keyMap = new Map();
      this.#seenMutationNodes.set(type, keyMap);
    }

    const node = mutationNodeFor(this, type, mutationKey);
    keyMap.set(mutationKey, node);
    return node;
  }

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

  replaceAndMutateReference<TType extends Type>(
    reference: MemberType,
    newType: TType,
    options: MutationOptions = new MutationOptions(),
  ) {
    const { references } = resolveReference(reference);
    return this.mutateWorker(newType, references, options);
  }

  protected mutateWorker<TType extends Type>(
    type: TType,
    references: MemberType[],
    options: MutationOptions,
    halfEdge?: MutationHalfEdge,
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

    const info = (mutatorClass as any).mutationInfo(this, type, references, options);
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

  mutate<TType extends Type>(
    type: TType,
    options: MutationOptions = new MutationOptions(),
    halfEdge?: MutationHalfEdge,
  ): MutationFor<TCustomMutations, TType["kind"]> {
    return this.mutateWorker(type, [], options, halfEdge);
  }

  mutateReference(
    reference: MemberType,
    options: MutationOptions = new MutationOptions(),
    halfEdge?: MutationHalfEdge,
  ): MutationFor<TCustomMutations> {
    const { referencedType, references } = resolveReference(reference);

    return this.mutateWorker(referencedType, references, options, halfEdge) as any;
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

export class MutationOptions {
  get mutationKey(): string {
    return "";
  }
}

export class MutationHalfEdge<
  THead extends Mutation<any, any> = any,
  TTail extends Mutation<any, any> = any,
> {
  head: THead;
  tail: TTail | undefined;
  #onTailCreation: (tail: TTail) => void;

  constructor(head: THead, onTailCreation: (tail: TTail) => void) {
    this.head = head;
    this.#onTailCreation = onTailCreation;
  }

  setTail(tail: TTail) {
    this.tail = tail;
    this.#onTailCreation(tail);
  }
}
