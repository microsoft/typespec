import type { CoverageSummary } from "../apis.js";

/**
 * Resolves the friendly display name for an emitter.
 *
 * Management-plane emitters are variants of their data-plane emitter package
 * (for example, `http-client-csharp-mgmt`). Reuse the base emitter's configured
 * display name so both variants are presented as the same language.
 */
export function getEmitterDisplayName(
  emitterName: string,
  report: CoverageSummary["generatorReports"][string],
  emitterDisplayNames?: Record<string, string>,
): string {
  const configuredName =
    emitterDisplayNames?.[emitterName] ??
    (emitterName.endsWith("-mgmt")
      ? emitterDisplayNames?.[emitterName.slice(0, -"-mgmt".length)]
      : undefined);

  if (configuredName) {
    return configuredName;
  }
  if (report?.generatorMetadata?.name) {
    return report.generatorMetadata.name;
  }

  const match = emitterName.match(/http-client-(\w+?)(?:-mgmt)?$/);
  if (match) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1);
  }
  return emitterName;
}
