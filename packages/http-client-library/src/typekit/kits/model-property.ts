import { BaseType, ModelProperty } from "@typespec/compiler";
import { defineKit, $ } from "@typespec/compiler/typekit";
import { getAuthentication, HttpAuth } from "@typespec/http";
import { Client } from "../../interfaces.js";

export interface SdkCredential extends BaseType {
  kind: "Credential";
  scheme: HttpAuth;
}

export interface SdkModelPropertyKit {
  /**
   * Returns whether it's an endpoint parameter or not.
   *
   * @param type whether it's an endpoint parameter or not
   */
  isEndpoint(client: Client, type: ModelProperty): boolean;

  /**
   * Get credential information from the model property. Returns undefined if the credential parameter 
   */
  getCredentialAuth(client: Client, type: ModelProperty): HttpAuth[] | undefined;

  /**
   * Returns whether the property is a discriminator on the model it's on.
   */
  isDiscriminator(type: ModelProperty): boolean;

  /**
   * Returns multipart information if it is 
   */
}

interface TypeKit {
  modelProperty: SdkModelPropertyKit;
}

declare module "@typespec/compiler/typekit" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ModelPropertyKit extends SdkModelPropertyKit {}
}

defineKit<TypeKit>({
  modelProperty: {
    isEndpoint(client, type) {
      const model = $.client.getInitializationModel(client);
      return type.name === "endpoint" && Boolean($.model.listProperties(model).find((p) => p === type));
    },
    getCredentialAuth(client, type) {
      const isCredential = $.model.listProperties($.client.getInitializationModel(client)).find((p) => p.name === "credential" && p === type);
      if (!isCredential) return undefined;
      return getAuthentication($.program, client.service)?.options.flatMap(o => o.schemes);
    },
    isDiscriminator(type) {
      const sourceModel = type.model;
      if (!sourceModel) return false;
      const disc = $.model.getDiscriminatorProperty(sourceModel);
      return disc === type;
    }
  },
});
