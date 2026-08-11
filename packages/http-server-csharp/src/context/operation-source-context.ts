import { createNamedContext, useContext } from "@alloy-js/core";
import type { Operation } from "@typespec/compiler";
import type { OperationHttpCanonicalization } from "@typespec/http-canonicalization";

export type OperationSourceMap = Map<OperationHttpCanonicalization, Operation>;

export const OperationSources = createNamedContext<OperationSourceMap>("OperationSources");

export function useOperationSources(): OperationSourceMap {
  return useContext(OperationSources) ?? new Map();
}
