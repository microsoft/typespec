import { ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import { TransformNamePolicy } from "../transport-name-policy.js";

export const TransformNamePolicyContext: ComponentContext<TransformNamePolicy> =
  createNamedContext<TransformNamePolicy>("TransfromNamePolicy", {
    getApplicationName(type) {
      return typeof type.name === "string" ? type.name : "";
    },
    getTransportName(type) {
      return typeof type.name === "string" ? type.name : "";
    },
  });

export function useTransformNamePolicy() {
  return useContext(TransformNamePolicyContext)!;
}
