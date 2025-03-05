import {
  getDiscriminatedUnion,
  getDiscriminator,
  ignoreDiagnostics,
  Model,
  ModelProperty,
} from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/experimental/typekit";
import { AccessKit, getAccess, getName, getUsage, NameKit, UsageKit } from "./utils.js";

export interface SdkModelKit extends NameKit<Model>, AccessKit<Model>, UsageKit<Model> {
  /**
   * Get the properties of a model.
   *
   * @param model model to get the properties
   */
  listProperties(model: Model): ModelProperty[];

  /**
   * Get discriminator of a model, if a discriminator exists
   *
   * @param model model to get the discriminator of
   */
  getDiscriminatorProperty(model: Model): ModelProperty | undefined;

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

interface SdkKit {
  model: SdkModelKit;
}

declare module "@typespec/compiler/experimental/typekit" {
  interface ModelKit extends SdkModelKit {}
}

defineKit<SdkKit>({
  model: {
    listProperties(model) {
      return [...model.properties.values()];
    },
    getDiscriminatorProperty(model) {
      const discriminator = getDiscriminator(this.program, model);
      if (!discriminator) return undefined;
      for (const property of this.model.listProperties(model)) {
        if (property.name === discriminator.propertyName) {
          return property;
        }
      }
      return undefined;
    },
    getDiscriminatorValue(model) {
      const disc = this.model.getDiscriminatorProperty(model);
      if (!disc) return undefined;
      switch (disc.type.kind) {
        case "String":
          return disc.type.value as string;
        case "EnumMember":
          return disc.type.name;
        default:
          throw Error("Discriminator must be a string or enum member");
      }
    },
    getDiscriminatedSubtypes(model) {
      const disc = getDiscriminator(this.program, model);
      if (!disc) return {};
      const discriminatedUnion = ignoreDiagnostics(getDiscriminatedUnion(model, disc));
      return discriminatedUnion?.variants || {};
    },
    getBaseModel(model) {
      return model.baseModel;
    },
    getAccess(model) {
      return getAccess(model);
    },
    getUsage(model) {
      return getUsage(model);
    },
    getName(model) {
      return getName(model);
    },
  },
});
