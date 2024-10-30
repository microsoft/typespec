import { BaseType, ModelProperty } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import { HttpAuth } from "@typespec/http";
import { Client } from "./client.js";

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
  isEndpoint(modelProperty: ModelProperty): boolean;

  /**
   * Returns whehter it's a credential parameter or not.
   *
   * @param type: model property we are checking to see if is a credential parameter
   */
  isCredential(client: Client, modelProperty: ModelProperty): boolean;

  /**
   * Returns whether the model property is part of the client's initialization or not.
   */
  isOnClient(modelProperty: ModelProperty): boolean;

  /**
   * Returns whether the model property has a client default value or not.
   */
  getClientDefaultValue(modelProperty: ModelProperty): unknown;
}

interface TypeKit {
  modelProperty: SdkModelPropertyKit;
}

declare module "@typespec/compiler/typekit" {
  interface ModelPropertyKit extends SdkModelPropertyKit {}
}

defineKit<TypeKit>({
  modelProperty: {
    isEndpoint(modelProperty) {
      return modelProperty.name === "endpoint";
    },
    isCredential(modelProperty) {
      return modelProperty.name === "credential";
    },
    isOnClient(modelProperty) {
      return false;
    },
    getClientDefaultValue(modelProperty) {
      return undefined;
    },
  },
});
