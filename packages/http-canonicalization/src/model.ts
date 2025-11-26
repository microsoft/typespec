import type { MemberType, Model } from "@typespec/compiler";
import { getVisibilitySuffix, Visibility } from "@typespec/http";
import { ModelMutation } from "@typespec/mutator-framework";
import { Codec, getJsonEncoderRegistry } from "./codecs.js";
import type { HttpCanonicalizationMutations } from "./http-canonicalization-classes.js";
import type { HttpCanonicalizer } from "./http-canonicalization.js";
import type { ModelPropertyHttpCanonicalization } from "./model-property.js";
import { HttpCanonicalizationOptions } from "./options.js";
import type { ScalarHttpCanonicalization } from "./scalar.js";

/**
 * Canonicalizes models for HTTP.
 */
export class ModelHttpCanonicalization extends ModelMutation<
  HttpCanonicalizationOptions,
  HttpCanonicalizationMutations,
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

  /**
   * Mutation subgraph for language types.
   */
  get #languageSubgraph() {
    return this.engine.getLanguageSubgraph(this.options);
  }

  /**
   * Mutation subgraph for wire types.
   */
  get #wireSubgraph() {
    return this.engine.getWireSubgraph(this.options);
  }

  /**
   * The possibly mutated language type for this model.
   */
  get languageType() {
    return this.getMutatedType(this.#languageSubgraph);
  }

  /**
   * The possibly mutated wire type for this model.
   */
  get wireType() {
    return this.getMutatedType(this.#wireSubgraph);
  }

  constructor(
    engine: HttpCanonicalizer,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: HttpCanonicalizationOptions,
  ) {
    super(engine, sourceType, referenceTypes, options);
    this.isDeclaration = !!this.sourceType.name;
    const registry = getJsonEncoderRegistry(this.engine.$);
    this.codec = registry.detect(this);
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

  /**
   * Applies mutations required to build the language and wire views of the model.
   */
  mutate() {
    const languageNode = this.getMutationNode(this.engine.getLanguageSubgraph(this.options));
    languageNode.whenMutated(this.#renameWhenMutated.bind(this));

    const wireNode = this.getMutationNode(this.engine.getWireSubgraph(this.options));
    wireNode.whenMutated(this.#renameWhenMutated.bind(this));

    if (this.engine.$.array.is(this.sourceType) && this.sourceType.name === "Array") {
      if (this.sourceType.baseModel) {
        this.baseModel = this.engine.mutate(this.sourceType.baseModel, this.options);
      }

      for (const prop of this.sourceType.properties.values()) {
        this.properties.set(prop.name, this.engine.mutate(prop, this.options));
      }

      const newIndexerOptions: Partial<HttpCanonicalizationOptions> = {
        visibility: this.options.visibility | Visibility.Item,
      };

      if (this.options.isJsonMergePatch()) {
        newIndexerOptions.contentType = "application/json";
      }

      this.indexer = {
        key: this.engine.mutate(
          this.sourceType.indexer.key,
          this.options,
        ) as ScalarHttpCanonicalization,
        value: this.engine.mutate(
          this.sourceType.indexer.value,
          this.options.with(newIndexerOptions),
        ),
      };

      return;
    }

    super.mutate();
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
