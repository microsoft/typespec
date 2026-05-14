import type { MemberType, ModelProperty, Type } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
  TypeEdgeSpec,
} from "./mutation-engine.js";
import { Mutation } from "./mutation.js";

export abstract class ModelPropertyMutation<
  TCustomMutations extends CustomMutationClasses,
  TOptions extends MutationOptions,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<ModelProperty, TCustomMutations, TOptions, TEngine> {
  readonly kind = "ModelProperty";
  type!: MutationFor<TCustomMutations, Type["kind"]>;

  /**
   * Mutates this model property.
   *
   * @param newOptions - Mutation options to apply. Defaults to the current options.
   * @param typeOverride - When provided, this single edge spec replaces the entire
   *   `buildTypeEdges()` result, allowing callers to redirect the type edge as a
   *   self-contained codec — including the half-edge — without subclassing. Use
   *   `referenceToFollow` to preserve reference-chain context, or `typeToFollow`
   *   to mutate an explicit type directly. For multi-subgraph routing prefer
   *   overriding `buildTypeEdges()` instead.
   */
  mutate(newOptions: MutationOptions = this.options, typeOverride?: TypeEdgeSpec) {
    if (typeOverride) {
      const { typeToFollow, referenceToFollow, halfEdge } = typeOverride;
      if (referenceToFollow !== undefined) {
        this.type = this.engine.mutateReference(
          referenceToFollow as MemberType,
          newOptions,
          halfEdge,
        ) as unknown as MutationFor<TCustomMutations, Type["kind"]>;
      } else {
        this.type = this.engine.mutate(
          typeToFollow!,
          newOptions,
          halfEdge,
        ) as unknown as MutationFor<TCustomMutations, Type["kind"]>;
      }
      return;
    }

    const edges = this.buildTypeEdges();
    for (let i = 0; i < edges.length; i++) {
      const { typeToFollow, referenceToFollow, halfEdge } = edges[i];
      if (referenceToFollow !== undefined) {
        const mut = this.engine.mutateReference(
          referenceToFollow as MemberType,
          newOptions,
          halfEdge,
        );
        if (i === 0) {
          this.type = mut as unknown as MutationFor<TCustomMutations, Type["kind"]>;
        }
      } else {
        const mut = this.engine.mutate(typeToFollow!, newOptions, halfEdge);
        if (i === 0) {
          this.type = mut as unknown as MutationFor<TCustomMutations, Type["kind"]>;
        }
      }
    }
  }

  /**
   * Returns the type edge specifications for this property mutation.
   *
   * Override this method to emit multiple edge specs — one per subgraph — when the
   * property must wire its type edge differently in each subgraph (e.g. ARM vs client).
   * Each spec identifies:
   *   - `typeToFollow`: an explicit type to mutate directly (uses `engine.mutate()`), or
   *   - `referenceToFollow`: a MemberType to resolve via the reference chain (uses
   *     `engine.mutateReference()`, preserving `referenceTypes` context).
   *   - `halfEdge`: the half-edge that wires the connection when the tail is resolved.
   *
   * The default implementation returns a single spec that follows the source property's
   * reference chain, which preserves the existing single-subgraph behavior.
   */
  protected buildTypeEdges(): TypeEdgeSpec[] {
    return [
      {
        referenceToFollow: this.sourceType,
        halfEdge: this.startTypeEdge(),
      },
    ];
  }

  /**
   * Returns a half-edge for the property's type connection.
   *
   * Override this for single-subgraph cases. For multi-subgraph cases (where the
   * property needs independent type edges per subgraph), override `buildTypeEdges()`
   * instead and return one spec per subgraph. If `buildTypeEdges()` is overridden
   * without also overriding `startTypeEdge()`, this method will throw.
   */
  protected startTypeEdge(): MutationHalfEdge {
    throw new Error(
      "ModelPropertyMutation: either override startTypeEdge() for single-subgraph " +
        "mutations, or override buildTypeEdges() for multi-subgraph mutations.",
    );
  }
}
