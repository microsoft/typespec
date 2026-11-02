import type { MemberType, Scalar } from "@typespec/compiler";
import type {
  CustomMutationClasses,
  MutationEngine,
  MutationFor,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import { Mutation, type MutationInfo } from "./mutation.js";

/**
 * Traverses a scalar's base scalar, when present.
 * Subclasses supply the half-edge connecting the base strategy to their output.
 */
export abstract class ScalarMutation<
  TOptions extends MutationOptions,
  TCustomMutations extends CustomMutationClasses,
  TEngine extends MutationEngine<TCustomMutations> = MutationEngine<TCustomMutations>,
> extends Mutation<Scalar, TCustomMutations, TOptions, TEngine> {
  /** Strategy discriminator; replacing output nodes does not change this value. */
  readonly kind = "Scalar";
  /** Resolved base strategy, absent when the source scalar has no base. */
  baseScalar?: MutationFor<TCustomMutations, "Scalar">;

  /** Initializes scalar traversal with the source and the selected mutation metadata. */
  constructor(
    engine: TEngine,
    sourceType: Scalar,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  protected mutateBaseScalar() {
    if (this.sourceType.baseScalar) {
      this.baseScalar = this.engine.mutate(
        this.sourceType.baseScalar,
        this.options,
        this.startBaseScalarEdge(),
      );
    }
  }

  protected abstract startBaseScalarEdge(): MutationHalfEdge;

  /** Resolves and connects the source base scalar using this strategy's options. */
  mutate() {
    this.mutateBaseScalar();
  }
}
