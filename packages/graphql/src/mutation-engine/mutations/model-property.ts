import { isArrayModelType, type MemberType, type ModelProperty } from "@typespec/compiler";
import {
  SimpleModelPropertyMutation,
  type MutationInfo,
  type SimpleMutationEngine,
  type SimpleMutationOptions,
  type SimpleMutations,
} from "@typespec/mutator-framework";
import { setNullable, setNullableElements } from "../../../generated-defs/TypeSpec.GraphQL.js";
import { applyFieldNamePipeline } from "../../lib/naming.js";
import { isNullableUnion, unwrapNullableUnion } from "../../lib/type-utils.js";

/** GraphQL-specific ModelProperty mutation. */
export class GraphQLModelPropertyMutation extends SimpleModelPropertyMutation<SimpleMutationOptions> {
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<SimpleMutationOptions>>,
    sourceType: ModelProperty,
    referenceTypes: MemberType[],
    options: SimpleMutationOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    // Register rename callback before edge connections trigger mutation.
    this.mutationNode.whenMutated((property) => {
      if (property) {
        property.name = applyFieldNamePipeline(property.name);
      }
    });
  }

  mutate() {
    const program = this.engine.$.program;

    // Snapshot nullability from the original type BEFORE mutation replaces it.
    // We mark the property (not the inner type) to avoid poisoning shared singletons.
    // A `@nullable` / `@nullableElements` applied directly to the source is re-applied
    // on the mutated clone during `finishType`, so it needs no explicit propagation here.
    const originalType = this.sourceType.type;

    const isInlineNullable = isNullableUnion(originalType);

    // For element nullability, look through an outer `| null` wrapper to find the array.
    // e.g. `(string | null)[] | null` → unwrap outer null → check array elements.
    const innerType =
      originalType.kind === "Union"
        ? (unwrapNullableUnion(originalType) ?? originalType)
        : originalType;

    const isArrayWithNullableElements =
      innerType.kind === "Model" &&
      isArrayModelType(innerType) &&
      isNullableUnion(innerType.indexer.value);

    this.mutationNode.mutate();
    super.mutate();

    if (isInlineNullable) {
      setNullable(program, this.mutatedType);
    }
    if (isArrayWithNullableElements) {
      setNullableElements(program, this.mutatedType);
    }
  }
}
