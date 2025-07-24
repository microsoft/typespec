import { BaseType, ModelProperty, Value } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import { HttpAuth } from "@typespec/http";
import { _InternalClient as Client } from "../../interfaces.js";
import { authSchemeSymbol, credentialSymbol } from "../../types/credential-symbol.js";
import { AccessKit, getAccess, getName, NameKit } from "./utils.js";

export interface SdkCredential extends BaseType {
  kind: "Credential";
  scheme: HttpAuth;
}

export interface SdkModelPropertyKit extends NameKit<ModelProperty>, AccessKit<ModelProperty> {
  /**
   * Get credential information from the model property. Returns undefined if the credential parameter
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
   * Returns whether the model property is part of the client's initialization or not.
   */
  isOnClient(client: Client, modelProperty: ModelProperty): boolean;

  /**
   * Returns whether the model property has a client default value or not.
   */
  getClientDefaultValue(client: Client, modelProperty: ModelProperty): Value | undefined;

  /**
   * Get access of a property
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
