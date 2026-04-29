import {
  discriminatedDecorator,
  getDiscriminator,
  getFriendlyName,
  type MemberType,
  type Model,
  type Union,
} from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { getVisibilitySuffix, Visibility } from "@typespec/http";
import {
  ModelMutation,
  MutationHalfEdge,
  type MutationNodeForType,
  type MutationTraits,
} from "@typespec/mutator-framework";
import { Codec } from "./codecs.js";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import type {
  CanonicalizationPredicate,
  HttpCanonicalizationCommon,
  HttpCanonicalizationInfo,
  HttpCanonicalizer,
} from "./http-canonicalization.js";
import type { ModelPropertyHttpCanonicalization } from "./model-property.js";
import { HttpCanonicalizationOptions } from "./options.js";
import type { UnionHttpCanonicalization } from "./union.js";

const polymorphicUnionCache = new WeakMap<Model, Union>();
function getUnionForPolymorphicModel($: Typekit, model: Model) {
  if (polymorphicUnionCache.has(model)) {
    return polymorphicUnionCache.get(model)!;
  }

  const unionInfo = $.model.getDiscriminatedUnion(model)!;

  const union = $.union.create({
    name: model.name + "Union",
    decorators: [
      [
        discriminatedDecorator,
        { envelope: "none", discriminatorPropertyName: unionInfo.propertyName },
      ],
    ],
    variants: [...unionInfo.variants].map(([name, type]) => {
      return $.unionVariant.create({ name, type });
    }),
  });

  polymorphicUnionCache.set(model, union);
  return union;
}
/**
 * Canonicalizes models for HTTP.
 */
export class ModelHttpCanonicalization
  extends ModelMutation<
    HttpCanonicalizationMutations,
    HttpCanonicalizationOptions,
    HttpCanonicalizer
  >
  implements HttpCanonicalizationCommon
{
  isDeclaration = false;
  codec: Codec | null = null;

  #languageMutationNode: MutationNodeForType<Model>;
  get languageMutationNode() {
    return this.#languageMutationNode;
  }

  #wireMutationNode: MutationNodeForType<Model>;
  get wireMutationNode() {
    return this.#wireMutationNode;
  }

  get languageType() {
    return this.#languageMutationNode.mutatedType;
  }

  get wireType() {
    return this.#wireMutationNode.mutatedType;
  }

  /**
   * Whether this this model is a polymorphic model, i.e. has the @discriminator
   * decorator on it. Such models are essentially unions of all their subtypes.
   */
  isPolymorphicModel: boolean = false;

  /**
   * When this model is a polymorphic model, a discriminated union type of all
   * the subtypes of the model.
   */
  polymorphicModelUnion: UnionHttpCanonicalization | null = null;

  /**
   * Tests whether the subgraph rooted at this canonicalization uses only
   * the identity codec (no transformation).
   */
  subgraphUsesIdentityCodec(): boolean {
    return this.engine.subgraphUsesIdentityCodec(this);
  }

  /**
   * Tests whether the subgraph rooted at this canonicalization satisfies
   * the provided predicate.
   */
  subgraphMatchesPredicate(predicate: CanonicalizationPredicate): boolean {
    return this.engine.subgraphMatchesPredicate(this, predicate);
  }

  static mutationInfo(
    engine: HttpCanonicalizer,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    halfEdge?: MutationHalfEdge<any, any>,
    traits?: MutationTraits,
  ): HttpCanonicalizationInfo | UnionHttpCanonicalization | ModelHttpCanonicalization {
    // Models don't directly use codecs, they're used on their properties
    const isDiscriminated = !!getDiscriminator(engine.$.program, sourceType);
    if (halfEdge?.head !== undefined && halfEdge.kind !== "base" && isDiscriminated) {
      // If we aren't the base of another model, we are the union.

      const union = getUnionForPolymorphicModel(engine.$, sourceType);
      if (referenceTypes.length === 0) {
        return engine.mutate(union, options, halfEdge, { isSynthetic: true });
      } else {
        return engine.replaceAndMutateReference(referenceTypes[0], union, options, halfEdge);
      }
    }

    const effectiveModel = engine.$.model.getEffectiveModel(sourceType);
    if (effectiveModel !== sourceType) {
      // If this model is an alias, we just forward to the effective model
      if (referenceTypes.length === 0) {
        return engine.mutate(effectiveModel, options, halfEdge);
      } else {
        return engine.replaceAndMutateReference(
          referenceTypes[0],
          effectiveModel,
          options,
          halfEdge,
        );
      }
    }

    return {
      mutationKey: options.mutationKey,
      isPolymorphicModel: isDiscriminated,
      isSynthetic: traits?.isSynthetic,
    };
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    info: HttpCanonicalizationInfo,
    traits: MutationTraits,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.isDeclaration = !!this.sourceType.name;
    this.#languageMutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey + "-language",
      isSynthetic: info.isSynthetic,
    });
    this.#wireMutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey + "-wire",
      isSynthetic: info.isSynthetic,
    });

    this.isPolymorphicModel = !!info.isPolymorphicModel;
  }

  /**
   * The canonical properties that are visible under the current visibility
   * options.
   */
  get visibleProperties(): Map<string, ModelPropertyHttpCanonicalization> {
    return new Map(
      [...(this.properties as Map<string, ModelPropertyHttpCanonicalization>)].filter(
        ([_, p]) => (p as ModelPropertyHttpCanonicalization).isVisible,
      ),
    );
  }

  mutate() {
    if (this.isPolymorphicModel) {
      this.polymorphicModelUnion = this.engine.canonicalize(
        getUnionForPolymorphicModel(this.engine.$, this.sourceType),
        this.options,
      );
    }
    // fix up merge patch update graph node
    if (this.sourceType.name === "MergePatchUpdate" && this.sourceType.properties.size > 0) {
      const firstProp = this.sourceType.properties.values().next().value!;
      const model = firstProp.model!;

      this.#languageMutationNode = this.#languageMutationNode.replace(
        this.engine.$.type.clone(model),
      ) as any;
      this.#wireMutationNode = this.#wireMutationNode.replace(
        this.engine.$.type.clone(model),
      ) as any;
    }

    const friendlyName = getFriendlyName(this.engine.$.program, this.sourceType);
    if (friendlyName) {
      this.#languageMutationNode.mutate((type) => {
        type.name = friendlyName;
      });
      this.#wireMutationNode.mutate((type) => (type.name = friendlyName));
    } else {
      this.#languageMutationNode.whenMutated(this.#renameWhenMutated.bind(this));
      this.#wireMutationNode.whenMutated(this.#renameWhenMutated.bind(this));
    }

    super.mutateBaseModel();
    super.mutateProperties();
    super.mutateIndexer();
  }

  protected startBaseEdge(): MutationHalfEdge {
    return new MutationHalfEdge("base", this, (tail) => {
      this.#languageMutationNode.connectBase(tail.languageMutationNode);
      this.#wireMutationNode.connectBase(tail.wireMutationNode);
    });
  }

  protected startPropertyEdge(): MutationHalfEdge {
    return new MutationHalfEdge("property", this, (tail) => {
      this.#languageMutationNode.connectProperty(tail.languageMutationNode);
      this.#wireMutationNode.connectProperty(tail.wireMutationNode);
    });
  }

  protected startIndexerValueEdge(): MutationHalfEdge {
    return new MutationHalfEdge("indexerValue", this, (tail) => {
      this.#languageMutationNode.connectIndexerValue(tail.languageMutationNode);
      this.#wireMutationNode.connectIndexerValue(tail.wireMutationNode);
    });
  }

  protected startIndexerKeyEdge(): MutationHalfEdge {
    return new MutationHalfEdge("indexerKey", this, (tail) => {
      this.#languageMutationNode.connectIndexerKey(tail.languageMutationNode);
      this.#wireMutationNode.connectIndexerKey(tail.wireMutationNode);
    });
  }

  /**
   * Adds visibility-based suffixes to mutated models to ensure unique naming.
   */
  #renameWhenMutated(m: Model | null) {
    if (!m || !m.name) return;

    const suffix = getVisibilitySuffix(this.options.visibility, Visibility.Read);

    const mergePatchSuffix =
      this.options.contentType === "application/merge-patch+json" ? "MergePatch" : "";
    m.name = `${m.name}${suffix}${mergePatchSuffix}`;
  }
}
