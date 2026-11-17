import type { BaseType, ModelProperty, Value } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import type { HttpAuth } from "@typespec/http";
import type { InternalClient as Client } from "../../interfaces.js";
import { authSchemeSymbol, credentialSymbol } from "../../types/credential-symbol.js";
import type { AccessKit, NameKit } from "./utils.js";
import { getAccess, getName } from "./utils.js";

/** Associates a synthetic credential type with the HTTP authentication scheme it satisfies. */
export interface SdkCredential extends BaseType {
  /** Discriminant distinguishing credential metadata from built-in compiler type kinds. */
  kind: "Credential";
  /** HTTP authentication scheme represented by this credential. */
  scheme: HttpAuth;
}

/**
 * Client-specific property queries added to `$.modelProperty`, including synthetic constructor
 * credentials, client initialization membership, and discriminator detection.
 */
export interface SdkModelPropertyKit extends NameKit<ModelProperty>, AccessKit<ModelProperty> {
  /**
   * Gets attached HTTP authentication schemes for a synthetic credential parameter.
   * Returns undefined for other properties, or an empty array if a credential has no attached schemes.
   */
  getCredentialAuth(type: ModelProperty): HttpAuth[] | undefined;

  /**
   * Returns whether the property is a discriminator on the model it's on.
   */
  isDiscriminator(type: ModelProperty): boolean;
  /**
   * Returns whether it's a credential parameter or not.
   *
   * @param type: model property we are checking to see if is a credential parameter
   */
  isCredential(modelProperty: ModelProperty): boolean;

  /**
   * Checks whether a constructor parameter has the same name as this property.
   * Membership is currently name-based, not a comparison of property identities.
   */
  isOnClient(client: Client, modelProperty: ModelProperty): boolean;

  /**
   * Returns the property's default value if it belongs to the client's initialization signature.
   * Returns undefined for other properties, or when no default is set.
   */
  getClientDefaultValue(client: Client, modelProperty: ModelProperty): Value | undefined;

  /**
   * Gets the property's client visibility; currently always returns `"public"`.
   */
  getAccess(modelProperty: ModelProperty): "public" | "internal";
}

interface TypeKit {
  modelProperty: SdkModelPropertyKit;
}

declare module "@typespec/compiler/typekit" {
  interface ModelPropertyKit extends SdkModelPropertyKit {}
}

defineKit<TypeKit>({
  modelProperty: {
    isCredential(modelProperty) {
      return credentialSymbol in modelProperty && modelProperty[credentialSymbol] === true;
    },
    isOnClient(client, modelProperty) {
      const clientParams = this.operation.getClientSignature(
        client,
        this.client.getConstructor(client),
      );
      // TODO: better comparison than name
      return Boolean(clientParams.find((p) => p.name === modelProperty.name));
    },
    getClientDefaultValue(client, modelProperty) {
      if (!this.modelProperty.isOnClient(client, modelProperty)) return undefined;
      return modelProperty.defaultValue;
    },
    getCredentialAuth(type) {
      if (!this.modelProperty.isCredential(type)) {
        return undefined;
      }

      if (type.type.kind === "Union") {
        const schemes: HttpAuth[] = [];
        for (const variant of type.type.variants.values()) {
          if (authSchemeSymbol in variant.type && variant.type[authSchemeSymbol] !== undefined) {
            const httpAuth = variant.type[authSchemeSymbol];
            schemes.push(httpAuth);
          }
        }

        return schemes;
      }

      if (authSchemeSymbol in type.type && type.type[authSchemeSymbol] !== undefined) {
        return [type.type[authSchemeSymbol]];
      }

      return [];
    },
    isDiscriminator(type) {
      const sourceModel = type.model;
      if (!sourceModel) return false;
      const disc = this.model.getDiscriminatorProperty(sourceModel);
      return disc === type;
    },
    getAccess(modelProperty) {
      return getAccess(modelProperty);
    },
    getName(modelProperty) {
      return getName(modelProperty);
    },
  },
});
