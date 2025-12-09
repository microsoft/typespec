import type { MemberType, Type } from "@typespec/compiler";
import type { MutationEngine } from "../mutation/mutation-engine.js";
import { mutationNodeFor, type MutationNodeForType } from "./factory.js";
import type { MutationNode } from "./mutation-node.js";

/**
 * A subgraph of mutation nodes such that there is one node per type in the graph.
 */
export class MutationSubgraph {
  #seenNodes = new Map<Type, MutationNode<Type>>();
  #seenReferenceNodes = new Map<MemberType, MutationNode<Type>>();

  engine: MutationEngine<any>;

  constructor(engine: MutationEngine<any>) {
    this.engine = engine;
  }

  getNode<T extends Type>(type: T, memberReferences: MemberType[] = []): MutationNodeForType<T> {
    if (memberReferences.length > 0) {
      return this.getReferenceNode(memberReferences[0]!) as any;
    }

    if (this.#seenNodes.has(type)) {
      return this.#seenNodes.get(type)! as MutationNodeForType<T>;
    }

    const node = mutationNodeFor(this, type);
    this.#seenNodes.set(type, node);
    node.traverse();

    return node;
  }

  getReferenceNode(memberType: MemberType): MutationNode<Type> {
    if (this.#seenReferenceNodes.has(memberType)) {
      return this.#seenReferenceNodes.get(memberType)!;
    }

    let referencedType: Type = memberType;
    while (referencedType.kind === "ModelProperty" || referencedType.kind === "UnionVariant") {
      referencedType = referencedType.type;
    }
    const node = mutationNodeFor(this, referencedType);
    node.referenceType = memberType;
    this.#seenReferenceNodes.set(memberType, node);
    node.traverse();

    return node;
  }

  replaceNode(oldNode: MutationNode<Type>, newNode: MutationNode<Type>) {
    this.#seenNodes.set(oldNode.sourceType, newNode);
  }

  replaceReferenceNode(referenceType: MemberType, newNode: MutationNode<Type>) {
    this.#seenReferenceNodes.set(referenceType, newNode);
  }
}
