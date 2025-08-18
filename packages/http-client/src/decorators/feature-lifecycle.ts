import { Program, Type } from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";
import { ExperimentalDecorator } from "../../generated-defs/TypeSpec.HttpClient.js";
import { createStateSymbol } from "../lib.js";
import { parseScopeFilter, ScopedValue } from "./scope-cache.js";

const featureLifecycleStateSymbol = createStateSymbol("featureLifecycleState");

const [getFeatureLifecycleState, setFeatureLifecycleState] = useStateMap<Type, ScopedValue<string>>(
  featureLifecycleStateSymbol,
);

export const $experimental: ExperimentalDecorator = (context, target, options) => {
  const scopeFilter = parseScopeFilter(options?.emitterScope);
  setFeatureLifecycleState(context.program, target, {
    emitterFilter: scopeFilter,
    value: "Experimental",
  });
};

export interface GetFeatureLifecycleOptions {
  emitterName?: string;
}
export function getClientFeatureLifecycle(
  program: Program,
  target: Type,
  options: GetFeatureLifecycleOptions = {},
): string | undefined {
  const lifecycle = getFeatureLifecycleState(program, target);

  if (!lifecycle) {
    return undefined;
  }

  const emitterScope = options.emitterName;
  const lifecycleValue = lifecycle.value;

  if (lifecycle.emitterFilter.isUnscoped) {
    return lifecycle.value;
  }

  if (!emitterScope) {
    return lifecycle?.emitterFilter.isUnscoped ? lifecycleValue : undefined;
  }

  if (lifecycle.emitterFilter.includedEmitters.length) {
    return lifecycle.emitterFilter.includedEmitters.includes(emitterScope)
      ? lifecycleValue
      : undefined;
  }

  if (lifecycle.emitterFilter.excludedEmitters.length) {
    return lifecycle.emitterFilter.excludedEmitters.includes(emitterScope)
      ? undefined
      : lifecycleValue;
  }
}
