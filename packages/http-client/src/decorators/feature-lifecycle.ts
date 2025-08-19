import { createDiagnosticCollector, DiagnosticResult, Program, Type } from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";
import { ExperimentalDecorator } from "../../generated-defs/TypeSpec.HttpClient.js";
import { createStateSymbol } from "../lib.js";
import { parseScopeFilter, ScopedValue } from "./scope-cache.js";

const featureLifecycleStateSymbol = createStateSymbol("featureLifecycleState");

export type FeatureLifecycleStage = "Experimental";

const [getFeatureLifecycleState, setFeatureLifecycleState] = useStateMap<
  Type,
  ScopedValue<FeatureLifecycleStage>
>(featureLifecycleStateSymbol);

export const $experimental: ExperimentalDecorator = (context, target, options) => {
  const scopeFilter = parseScopeFilter(options?.emitterScope);
  if (scopeFilter.excludedEmitters.length > 0 && scopeFilter.includedEmitters.length > 0) {
    context.program.reportDiagnostic({
      code: "include-and-exclude-scopes",
      message: "The @experimental should only either include or exclude scopes, not both.",
      severity: "error",
      target,
    });
  }
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
): DiagnosticResult<FeatureLifecycleStage | undefined> {
  const diagnostics = createDiagnosticCollector();

  const lifecycle = getFeatureLifecycleState(program, target);

  if (!lifecycle) {
    return diagnostics.wrap(undefined);
  }

  const emitterScope = options.emitterName;
  const lifecycleValue = lifecycle.value;

  if (!lifecycle.emitterFilter.isScoped) {
    return diagnostics.wrap(lifecycleValue);
  }

  // Lifecycle is scoped but no emitter scope is provided to the query function so we return undefined
  // this is because we can't determine which emitter the lifecycle is associated with.
  if (!emitterScope) {
    diagnostics.add({
      code: "use-client-context-without-provider",
      message: "No emitter scope provided to getClientFeatureLifecycle.",
      target,
      severity: "warning",
    });
    return diagnostics.wrap(undefined);
  }

  if (lifecycle.emitterFilter.includedEmitters.length) {
    const value = lifecycle.emitterFilter.includedEmitters.includes(emitterScope)
      ? lifecycleValue
      : undefined;

    return diagnostics.wrap(value);
  }

  if (lifecycle.emitterFilter.excludedEmitters.length) {
    const value = lifecycle.emitterFilter.excludedEmitters.includes(emitterScope)
      ? undefined
      : lifecycleValue;

    return diagnostics.wrap(value);
  }

  return diagnostics.wrap(undefined);
}
