import { ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import { PropertyAccessPolicy } from "../property-access-policy.js";

export const PropertyAccessPolicyContext: ComponentContext<PropertyAccessPolicy> =
  createNamedContext<PropertyAccessPolicy>("TransfromNamePolicy", defaultPropertyAccessPolicy());

export function usePropertyAccessPolicy() {
  return useContext(PropertyAccessPolicyContext)!;
}


function defaultPropertyAccessPolicy(): PropertyAccessPolicy {
  return {
    fromatPropertyAccessExpression(_property, metadata) {
      return metadata.map(({segmentName}) => segmentName).join(".");
    },
  };
}
