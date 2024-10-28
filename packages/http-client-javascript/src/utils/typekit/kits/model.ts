import {
  AccessFlags,
  createTCGCContext,
  getGeneratedName,
  UsageFlags,
} from "@azure-tools/typespec-client-generator-core";
import {
  getDiscriminatedUnion,
  getDiscriminator,
  ignoreDiagnostics,
  Model,
  ModelProperty,
  Type,
} from "@typespec/compiler";
import { $, defineKit } from "@typespec/compiler/typekit";

export interface SdkModelKit {
  /**
   * Get the properties of a model.
   *
   * @param model model to get the properties
   */
  listProperties(model: Model): ModelProperty[];

  /**
   * Get generated name of a model if it doesn't have a name. If the model does have a name, return undefined.
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
      if (model.name) return undefined;
      // TODO: see if we can get rid of this call to create context
      const context = createTCGCContext($.program, "typescript");
      return getGeneratedName(context, model);
    },
    getAccess(model) {
      return "public";
    },
    getUsage(model) {
      return UsageFlags.None;
    },
    getAdditionalPropertiesType(model) {
      // model MyModel is Record<> {} should be model with additional properties
      if (model.sourceModel?.kind === "Model" && model.sourceModel?.name === "Record") {
        return model.sourceModel!.indexer!.value!;
      }
      // model MyModel { ...Record<>} should be model with additional properties
      if (model.indexer) {
        return model.indexer.value;
      }
      return undefined;
    },
    getDiscriminatorProperty(model) {
      const discriminator = getDiscriminator($.program, model);
      if (!discriminator) return undefined;
      for (const property of $.model.listProperties(model)) {
        if (property.name === discriminator.propertyName) {
          return property;
        }
      }
    },
    getDiscriminatorValue(model) {
      const disc = $.model.getDiscriminatorProperty(model);
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
      const disc = getDiscriminator($.program, model);
      if (!disc) return {};
      const discriminatedUnion = ignoreDiagnostics(getDiscriminatedUnion(model, disc));
      return discriminatedUnion?.variants || {};
    },
    getBaseModel(model) {
      return model.baseModel;
    },
  },
});
