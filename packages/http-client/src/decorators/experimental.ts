import type { DiagnosticResult, Program, Type } from "@typespec/compiler";
import { createDiagnosticCollector } from "@typespec/compiler";
import { useStateMap } from "@typespec/compiler/utils";
import type { ExperimentalDecorator } from "../../generated-defs/TypeSpec.HttpClient.js";
import { createStateSymbol } from "../lib.js";
import type { ScopedValue } from "./scope-cache.js";
import { parseScopeFilter } from "./scope-cache.js";

const featureLifecycleStateSymbol = createStateSymbol("featureLifecycleState");

/** Lifecycle states that client emitters can surface for APIs marked with a lifecycle decorator. */
export type FeatureLifecycleStage = "Experimental";

/** Lifecycle metadata from a decorator after applying the querying emitter's scope filter. */
export interface FeatureLifecycleDetails {
  /** Lifecycle state to surface for this API; currently only experimental APIs are represented. */
  stage: FeatureLifecycleStage;
  /** Diagnostic identifier supplied for this API, or undefined when the decorator omits it. */
  diagnosticId?: string;
  /**
   * Diagnostic identifiers of experimental features this API depends on; empty when none are supplied.
   * A dependency becoming generally available does not automatically change this API's stage.
   */
  dependsOn: readonly string[];
}

const [getFeatureLifecycleState, setFeatureLifecycleState] = useStateMap<
  Type,
  ScopedValue<FeatureLifecycleDetails>
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
    value: {
      stage: "Experimental",
      diagnosticId: options?.diagnosticId,
      dependsOn: options?.dependsOn ?? [],
    },
  });
};

/** Selects which emitter's scoped lifecycle metadata to query. */
export interface GetFeatureLifecycleOptions {
  /**
   * Emitter name matched against the decorator's included or excluded emitter names.
   * If omitted, unscoped metadata is returned, but scoped metadata yields a warning and undefined.
   */
  emitterName?: string;
}
export function getClientFeatureLifecycle(
  program: Program,
  target: Type,
  options: GetFeatureLifecycleOptions = {},
): DiagnosticResult<FeatureLifecycleStage | undefined> {
  const [details, diagnostics] = getClientFeatureLifecycleDetails(program, target, options);
  return [details?.stage, diagnostics];
}

export function getClientFeatureLifecycleDetails(
  program: Program,
  target: Type,
  options: GetFeatureLifecycleOptions = {},
): DiagnosticResult<FeatureLifecycleDetails | undefined> {
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
