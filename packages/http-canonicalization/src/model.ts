import { getFriendlyName, type MemberType, type Model } from "@typespec/compiler";
import { getVisibilitySuffix, Visibility } from "@typespec/http";
import {
  ModelMutation,
  MutationHalfEdge,
  type MutationNodeForType,
} from "@typespec/mutator-framework";
import { Codec } from "./codecs.js";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import type { HttpCanonicalizationInfo, HttpCanonicalizer } from "./http-canonicalization.js";
import type { ModelPropertyHttpCanonicalization } from "./model-property.js";
import { HttpCanonicalizationOptions } from "./options.js";

/**
 * Canonicalizes models for HTTP.
 */
export class ModelHttpCanonicalization extends ModelMutation<
  HttpCanonicalizationMutations,
  HttpCanonicalizationOptions,
  HttpCanonicalizer
> {
  /**
   * Indicates if the canonicalization wraps a named TypeSpec declaration.
   */
  isDeclaration: boolean = false;

  /**
   * Codec chosen to transform language and wire types for this model.
   */
  codec: Codec;
  #languageMutationNode: MutationNodeForType<Model>;
  get languageMutationNode() {
    return this.#languageMutationNode;
  }

  #wireMutationNode: MutationNodeForType<Model>;
  get wireMutationNode() {
    return this.#wireMutationNode;
  }

  /**
   * The possibly mutated language type for this model.
   */
  get languageType() {
    return this.#languageMutationNode.mutatedType;
  }

  /**
   * The possibly mutated wire type for this model.
   */
  get wireType() {
    return this.#wireMutationNode.mutatedType;
  }

  static mutationInfo(
    engine: HttpCanonicalizer,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
  ): HttpCanonicalizationInfo {
    const mutationKey = options.mutationKey;

    // Models don't directly detect codecs, they're detected on their properties
    // For now, just return a null codec
    const codec = null as any;

    return {
      mutationKey,
      codec,
    };
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
    info: HttpCanonicalizationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.isDeclaration = !!this.sourceType.name;
    this.#languageMutationNode = this.engine.getMutationNode(
      this.sourceType,
      info.mutationKey + "-language",
    );
    this.#wireMutationNode = this.engine.getMutationNode(
      this.sourceType,
      info.mutationKey + "-wire",
    );

    this.codec = info.codec;
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
    return new MutationHalfEdge(this, (tail) => {
      this.#languageMutationNode.connectBase(tail.languageMutationNode);
      this.#wireMutationNode.connectBase(tail.wireMutationNode);
    });
  }

  protected startPropertyEdge(): MutationHalfEdge {
    return new MutationHalfEdge(this, (tail) => {
      this.#languageMutationNode.connectProperty(tail.languageMutationNode);
      this.#wireMutationNode.connectProperty(tail.wireMutationNode);
    });
  }

  protected startIndexerValueEdge(): MutationHalfEdge {
    return new MutationHalfEdge(this, (tail) => {
      this.#languageMutationNode.connectIndexerValue(tail.languageMutationNode);
      this.#wireMutationNode.connectIndexerValue(tail.wireMutationNode);
    });
  }

  protected startIndexerKeyEdge(): MutationHalfEdge {
    return new MutationHalfEdge(this, (tail) => {
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
