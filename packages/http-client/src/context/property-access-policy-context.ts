import { ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import { PropertyAccessPolicy } from "../property-access-policy.js";

export const PropertyAccessPolicyContext: ComponentContext<PropertyAccessPolicy> =
  createNamedContext<PropertyAccessPolicy>("TransfromNamePolicy");

export function usePropertyAccessPolicy() {
  return useContext(PropertyAccessPolicyContext)!;
}
