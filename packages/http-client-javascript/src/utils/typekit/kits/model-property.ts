import { AccessFlags, UsageFlags } from "@azure-tools/typespec-client-generator-core";
import { BaseType, Model, ModelProperty, Type } from "@typespec/compiler";
import { defineKit, $ } from "@typespec/compiler/typekit";
import { getAuthentication, HttpAuth } from "@typespec/http";

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
  isEndpoint(type: ModelProperty): boolean;

  /**
   * Returns whehter it's a credential parameter or not.
   * 
   * @param type: model property we are checking to see if is a credential parameter
   */
  isCredential(type: ModelProperty): boolean;
}

interface TypeKit {
  modelProperty: SdkModelPropertyKit;
}

declare module "@typespec/compiler/typekit" {
  interface ModelPropertyKit extends SdkModelPropertyKit {}
}

defineKit<TypeKit>({
  modelProperty: {
    isEndpoint(type) {
      return type.name === "endpoint";
    },
    isCredential(type) {
      return type.name === "credential";
    },
  },
});

