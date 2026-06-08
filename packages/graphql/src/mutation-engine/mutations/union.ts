import {
  type MemberType,
  type Model,
  type Type,
  type Union,
  getTypeName,
} from "@typespec/compiler";
import {
  MutationEngine,
  MutationHalfEdge,
  type MutationInfo,
  type MutationOptions,
  SimpleUnionVariantMutation,
  UnionMutation,
  UnionMutationNode,
  UnionVariantMutationNode,
} from "@typespec/mutator-framework";
import { reportDiagnostic } from "../../lib.js";
import {
  applyBaseNamePipeline,
  applyFieldNamePipeline,
  applyTypeNamePipeline,
} from "../../lib/naming.js";
import { setNullable } from "../../lib/nullable.js";
import { setOneOf } from "../../lib/one-of.js";
import { getUnionName, stripNullVariants, unwrapNullableUnion } from "../../lib/type-utils.js";
import { GraphQLMutationOptions, GraphQLTypeContext } from "../options.js";

/** Convert a variant name (string or symbol) to a string. */
function variantNameToString(name: string | symbol): string {
  return typeof name === "string" ? name : (name.description ?? "");
}

/**
 * Resolve the actual mutated type from a mutation result.
 * Handles the case where mutationNode.replace() was called — the inherited
 * mutatedType getter doesn't reflect replacements, so we check the node directly.
 */
function resolveType(mutation: {
  mutationNode: { isReplaced: boolean; replacementNode: any };
  mutatedType: Type;
}): Type {
  const node = mutation.mutationNode;
  if (node.isReplaced && node.replacementNode) {
    return node.replacementNode.mutatedType;
  }
  return mutation.mutatedType;
}

/**
 * GraphQL-specific Union mutation.
 *
 * Output context: flattens nested unions, deduplicates, wraps scalar variants.
 * Input context: replaces with @oneOf input object (GraphQL unions are output-only).
 */
export class GraphQLUnionMutation extends UnionMutation<MutationOptions, any, MutationEngine<any>> {
  #mutationNode: UnionMutationNode;
  #wrapperModels: Model[] = [];
  #flattenedUnion: Union | null = null;

  constructor(
    engine: MutationEngine<any>,
    sourceType: Union,
    referenceTypes: MemberType[],
    options: MutationOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey,
      isSynthetic: info.isSynthetic,
    }) as UnionMutationNode;
  }

  /** The input/output context, or undefined if options aren't GraphQLMutationOptions. */
  get typeContext(): GraphQLTypeContext | undefined {
    return this.options instanceof GraphQLMutationOptions ? this.options.typeContext : undefined;
  }

  get mutationNode() {
    return this.#mutationNode;
  }

  get mutatedType(): Union | Model {
    // In input context, the union node is replaced with a @oneOf Model
    if (this.#mutationNode.isReplaced && this.#mutationNode.replacementNode) {
      return this.#mutationNode.replacementNode.mutatedType as Model;
    }
    // Return flattened union if we created one, otherwise use mutation node's type
    return this.#flattenedUnion || this.#mutationNode.mutatedType;
  }

  /** Synthetic wrapper models for scalar union variants. */
  get wrapperModels() {
    return this.#wrapperModels;
  }

  /** Creates a half-edge for bidirectional variant mutation updates. */
  protected startVariantEdge(): MutationHalfEdge<
    GraphQLUnionMutation,
    SimpleUnionVariantMutation<MutationOptions>
  > {
    return new MutationHalfEdge("variant", this, (tail) => {
      this.#mutationNode.connectVariant(tail.mutationNode as UnionVariantMutationNode);
    });
  }

  mutate() {
    // T | null is not a real union — replace with the inner type.
    // Don't mark the replacement as nullable here; it's a shared singleton.
    // Nullability is tracked by the container (ModelProperty or Operation).
    const innerType = unwrapNullableUnion(this.sourceType);
    if (innerType) {
      const innerMutation = this.engine.mutate(innerType, this.options);
      this.#mutationNode.replace(resolveType(innerMutation));
      return;
    }

    if (this.typeContext === GraphQLTypeContext.Input) {
      this.mutateAsOneOfInput();
      return;
    }

    this.mutateAsOutputUnion();
    super.mutate();
  }

  /** Flatten nested unions, deduplicate, and wrap scalar variants in synthetic models. */
  private mutateAsOutputUnion() {
    const tk = this.engine.$;
    const program = tk.program;

    const rawName = getUnionName(this.sourceType, program);
    const unionName = applyTypeNamePipeline(rawName, { isInput: false, isInterface: false });

    const { variants: sourceVariants, isNullable: hasNull } = stripNullVariants(this.sourceType);

    const flattenedVariants = this.deduplicateVariants(this.flattenVariants(sourceVariants));

    if (flattenedVariants.length === 0) {
      reportDiagnostic(program, { code: "empty-union", target: this.sourceType });
      return;
    }

    if (flattenedVariants.length === 1) {
      const innerMutation = this.engine.mutate(flattenedVariants[0].type, this.options);
      this.#mutationNode.replace(resolveType(innerMutation));
      if (hasNull) {
        setNullable(program, this.mutatedType);
      }
      return;
    }

    const needsFlattening = flattenedVariants.length !== sourceVariants.length;

    // Mutate each variant's type so it goes through the full pipeline
    const mutatedVariants = flattenedVariants.map((variant) => ({
      name: variant.name,
      type: resolveType(this.engine.mutate(variant.type, this.options)),
    }));

    if (needsFlattening || hasNull) {
      const variantArray = mutatedVariants.map((variant) => {
        return tk.unionVariant.create({
          name: variantNameToString(variant.name),
          type: variant.type,
        });
      });

      const flattenedUnion = tk.union.create({
        name: unionName,
        variants: variantArray,
      });

      this.#flattenedUnion = flattenedUnion;
    } else {
      this.#mutationNode.mutate((union) => {
        union.name = unionName;
      });
    }

    if (hasNull) {
      setNullable(program, this.mutatedType);
    }

    // GraphQL unions can only contain object types — wrap scalars in synthetic models
    for (const variant of mutatedVariants) {
      const isScalar = variant.type.kind === "Scalar" || variant.type.kind === "Intrinsic";

      if (isScalar) {
        const variantName = variantNameToString(variant.name);
        const wrapperName =
          applyBaseNamePipeline(unionName) + applyBaseNamePipeline(variantName) + "UnionVariant";

        const valueProp = tk.modelProperty.create({
          name: "value",
          type: variant.type,
          optional: false,
        });

        const wrapperModel = tk.model.create({
          name: wrapperName,
          properties: { value: valueProp },
        });

        this.#wrapperModels.push(wrapperModel);
      }
    }
  }

  /**
   * Replace with a @oneOf input object (GraphQL unions are output-only).
   * @see https://spec.graphql.org/September2025/#sec-OneOf-Input-Objects
   */
  private mutateAsOneOfInput() {
    const tk = this.engine.$;
    const program = tk.program;

    const { variants: sourceVariants, isNullable: hasNull } = stripNullVariants(this.sourceType);

    const flattenedVariants = this.deduplicateVariants(this.flattenVariants(sourceVariants));

    if (flattenedVariants.length === 0) {
      reportDiagnostic(program, { code: "empty-union", target: this.sourceType });
      return;
    }

    const properties: Record<string, ReturnType<typeof tk.modelProperty.create>> = {};
    for (const variant of flattenedVariants) {
      const fieldName = applyFieldNamePipeline(variantNameToString(variant.name));
      const mutatedType = resolveType(this.engine.mutate(variant.type, this.options));
      properties[fieldName] = tk.modelProperty.create({
        name: fieldName,
        type: mutatedType,
        optional: true, // oneOf: exactly one must be provided
      });
    }

    const unionName = getUnionName(this.sourceType, program);
    const modelName = applyTypeNamePipeline(unionName, { isInput: true, isInterface: false });

    const oneOfModel = tk.model.create({
      name: modelName,
      properties,
    });

    setOneOf(program, oneOfModel);

    if (hasNull) {
      setNullable(program, oneOfModel);
    }

    this.#mutationNode.replace(oneOfModel);
  }

  /** Recursively flatten nested unions (GraphQL doesn't support nesting). */
  private flattenVariants(
    variants: readonly { name: string | symbol; type: Type }[],
    seen: Set<Union> = new Set(),
  ): Array<{ name: string | symbol; type: Type }> {
    const flattened: Array<{ name: string | symbol; type: Type }> = [];

    for (const variant of variants) {
      if (variant.type.kind === "Union") {
        const nestedUnion = variant.type as Union;
        if (seen.has(nestedUnion)) continue;
        seen.add(nestedUnion);

        const { variants: nestedVariants } = stripNullVariants(nestedUnion);
        flattened.push(...this.flattenVariants(nestedVariants, seen));
      } else {
        flattened.push({ name: variant.name, type: variant.type });
      }
    }

    return flattened;
  }

  /** Deduplicate variants by type identity; first occurrence wins. */
  private deduplicateVariants(
    variants: Array<{ name: string | symbol; type: Type }>,
  ): Array<{ name: string | symbol; type: Type }> {
    const seen = new Map<Type, { name: string | symbol; type: Type }>();
    const result: Array<{ name: string | symbol; type: Type }> = [];

    for (const variant of variants) {
      if (seen.has(variant.type)) {
        reportDiagnostic(this.engine.$.program, {
          code: "duplicate-union-variant",
          format: { type: getTypeName(variant.type) },
          target: this.sourceType,
        });
      } else {
        seen.set(variant.type, variant);
        result.push(variant);
      }
    }

    return result;
  }
}
