import type { Type } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import type { MutationEngine } from "../mutation/mutation-engine.js";
import { mutationNodeFor, type MutationNodeForType } from "./factory.js";
import type { MutationEdge } from "./mutation-edge.js";
import { traceNode } from "./tracer.js";

/**
 * Mutation nodes represent a node in the type graph that can possibly be
 * mutated. Each mutation node tracks the source type, the mutated type, and the
 * edges coming from other mutation nodes which represent references to the
 * source type for this node.
 *
 * The mutated type is initially a reference to the source type. When a node is
 * mutated, the mutated type is initialized to a clone of the source type and
 * any mutations are applied. Then all nodes which reference this node are also
 * mutated, which will cause their mutated types to reference the mutated type
 * of this node.
 *
 * Each node belongs to a mutation subgraph. Within a mutation subgraph, each
 * (source type, mutationKey) pair has exactly one mutation node. This allows
 * for the same type to have multiple mutation nodes with different mutation keys,
 * enabling fine-grained control over how types are mutated in different contexts.
 *
 * For example, given a graph for the TypeSpec code:
 *
 * ```tsp
 * scalar s extends string;
 * model A { aProp: s }
 * model B { bProp: s }
 * ```
 *
 * If you want to mutate the scalar `s` differently in the context of `A.aProp`
 * versus `B.bProp`, you would create two mutation nodes for the scalar with
 * different mutation keys:
 *
 * - `subgraph.getNode(s, "A.aProp")` - for the scalar in the context of A.aProp
 * - `subgraph.getNode(s, "B.bProp")` - for the scalar in the context of B.bProp
 * - `subgraph.getNode(s)` - for the scalar itself with the default mutation key
 *
 * Users are responsible for explicitly creating and connecting mutation nodes via
 * the `connect*` methods on each mutation node type. The mutation graph is no longer
 * automatically constructed through traversal.
 *
 * For example:
 *
 * ```ts
 * const modelNode = subgraph.getNode(myModel);
 * const propNode = subgraph.getNode(myModel.properties.get("myProp"));
 * const typeNode = subgraph.getNode(myPropType, "myModel.myProp");
 *
 * // Explicitly connect the nodes
 * modelNode.connectProperty(propNode, "myProp");
 * propNode.connectType(typeNode);
 * propNode.connectModel(modelNode);
 * ```
 */
/**
 * Types which are logically contained within another type (e.g. model
 * properties in models, union variants in unions, etc.) can have mutation nodes
 * that use different mutation keys to represent different mutation contexts.
 *
 * For example, given the following typespec code:
 *
 * ```tsp
 * model A { propA: B }
 * model B { propB: C }
 * model C { }
 * ```
 *
 * The mutation nodes can be structured like this:
 *
 * ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
 * │ Model A      ├──► Prop A       ├──► Model B (key: "...")├──► Prop B (key: "...")│
 * └──────────────┘  └───────┬──────┘  └──────────────────────┘  └──────┬───────────────┘
 *        ┌──────────────────┘                                           │
 * ┌──────▼───────┐  ┌──────────────┐  ┌──────────────────────┐         │
 * │ Model B      ├──► Prop B       ├──► Model C (key: "...")│         │
 * └──────────────┘  └───────┬──────┘  └──────────────────────┘         │
 *        ┌──────────────────┘                                           │
 * ┌──────▼───────┐                                                      │
 * │ Model C      ◄──────────────────────────────────────────────────────┘
 * └──────────────┘
 *
 * Where each Model B and Model C node can have different mutation keys to represent
 * different contexts in which they are referenced.
 */

let nextId = 0;

export abstract class MutationNode<T extends Type> {
  abstract readonly kind: string;

  id = nextId++;
  sourceType: T;
  mutatedType: T;
  isMutated: boolean = false;
  isDeleted: boolean = false;
  isReplaced: boolean = false;
  replacementNode: MutationNodeForType<Type> | null = null;
  inEdges: Set<MutationEdge<Type, T>> = new Set();
  engine: MutationEngine<any>;
  mutationKey: string;
  $: Typekit;
  protected connected: boolean = false;

  #whenMutatedCallbacks: ((mutatedType: Type | null) => void)[] = [];

  constructor(subgraph: MutationEngine<any>, sourceNode: T, mutationKey: string = "") {
    this.engine = subgraph;
    this.$ = this.engine.$;
    this.sourceType = sourceNode;
    this.mutatedType = sourceNode;
    this.mutationKey = mutationKey;
    traceNode(this, "Created.");
  }

  addInEdge(edge: MutationEdge<Type, T>) {
    this.inEdges.add(edge);
  }

  deleteInEdge(edge: MutationEdge<Type, T>) {
    this.inEdges.delete(edge);
  }

  whenMutated(cb: (mutatedType: T | null) => void) {
    this.#whenMutatedCallbacks.push(cb as any);
  }

  mutate(initializeMutation?: (type: T) => void) {
    if (this.isDeleted || this.isReplaced || this.isMutated) {
      traceNode(
        this,
        `Already deleted/replaced/mutated, skipping mutation: ${this.isDeleted}, ${this.isReplaced}, ${this.isMutated}`,
      );
      return;
    }

    if (this.isMutated) {
      traceNode(this, "Already mutated, running initialization");
      initializeMutation?.(this.mutatedType);
      return;
    }

    traceNode(this, "Mutating.");

    this.mutatedType = this.$.type.clone(this.sourceType);

    this.isMutated = true;
    initializeMutation?.(this.mutatedType);
    for (const cb of this.#whenMutatedCallbacks) {
      cb(this.mutatedType);
    }

    for (const edge of this.inEdges) {
      edge.tailMutated();
    }

    this.$.type.finishType(this.mutatedType);
  }

  delete() {
    traceNode(this, "Deleting.");

    this.isDeleted = true;

    for (const cb of this.#whenMutatedCallbacks) {
      cb(null);
    }

    this.mutatedType = this.$.intrinsic.never as T;

    for (const edge of this.inEdges) {
      edge.tailDeleted();
    }
  }

  replace(newType: Type) {
    if (this.isMutated || this.isDeleted || this.isReplaced) {
      return this;
    }

    traceNode(this, "Replacing.");

    // We need to make a new node because different types need to handle edge mutations differently.

    this.isReplaced = true;
    this.replacementNode = mutationNodeFor(this.engine, newType, this.mutationKey);
    // we don't need to do the clone stuff with this node, but we mark it as
    // mutated because we don't want to allow further mutations on it.
    this.replacementNode.isMutated = true;

    this.engine.replaceMutationNode(this, this.replacementNode);

    for (const edge of this.inEdges) {
      edge.tailReplaced(this.replacementNode);
    }

    return this.replacementNode;
  }

  toString() {
    return `MutationNode(${"name" in this.sourceType && typeof this.sourceType.name === "string" ? this.sourceType.name : this.kind}, key=${this.mutationKey}, id=${this.id})`;
  }
}
