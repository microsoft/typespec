import { AccessFlags, UsageFlags } from "@azure-tools/typespec-client-generator-core";
import { Model, ModelProperty, Type } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";

export interface SdkModelKit {
  /**
   * Get the properties of a model.
   *
   * @param model model to get the properties
   */
  listProperties(model: Model): ModelProperty[];

  /**
   * Get generated name of a model if it doesn't have a name
   *
   * @param model model to get the generated name of
   */
  getGeneratedName(model: Model): string | undefined;

  /**
   * Get the access flags of a model.
   *
   * @param model model to get the access flags of
   */
  getAccess(model: Model): AccessFlags;

  /**
   * Get the usage flags of a model.
   *
   * @param model model to get the usage flags
   */
  getUsage(model: Model): UsageFlags;

  /**
   * Get type of additionalProperties, if there are additional properties
   *
   * @param model model to get the additional properties type of
   */
  getAdditionalPropertiesType(model: Model): Type | undefined;

  /**
   * Get discriminator of a model, if a discriminator exists
   *
   * @param model model to get the discriminator of
   */
  getDiscriminator(model: Model): ModelProperty | undefined;

  /**
   * Get value of discriminator, if a discriminator exists
   *
   * @param model
   */
  getDiscriminatorValue(model: Model): string | undefined;

  /**
   * Get the discriminator mapping of the subtypes of a model, if a discriminator exists
   *
   * @param model
   */
  getDiscriminatedSubtypes(model: Model): Record<string, Model>;

  /**
   * Get the base model of a model, if a base model exists
   *
   * @param model model to get the base model
   */
  getBaseModel(model: Model): Model | undefined;
}

interface TypeKit {
  model: SdkModelKit;
}

declare module "@typespec/compiler/typekit" {
  interface ModelKit extends SdkModelKit {}
}

defineKit<TypeKit>({
  model: {
    listProperties(model) {
      return [...model.properties.values()];
    },
    getGeneratedName(model) {
      return "";
    },
    getAccess(model) {
      return "public";
    },
    getUsage(model) {
      return UsageFlags.None;
    },
    getAdditionalPropertiesType(model) {
      return undefined;
    },
    getDiscriminator(model) {
      return undefined;
    },
    getDiscriminatorValue(model) {
      return undefined;
    },
    getDiscriminatedSubtypes(model) {
      return {};
    },
    getBaseModel(model) {
      return model.baseModel;
    },
  },
});
