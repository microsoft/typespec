import type { DecoratorApplication, DecoratorContext, ModelProperty } from "./types.js";

/**
 * An explicit replacement of a property's inherited optionality.
 *
 * This experimental contract covers optionality only, not presence, name, type,
 * or other metadata. Libraries owning optionality metadata can retain its
 * decorator context and use `supersedes` when reading that metadata.
 *
 * @experimental
 */
export interface PropertyOptionalityOverride {
  /** The semantic optionality chosen by the transform, not a version snapshot. */
  readonly optional: boolean;

  /**
   * Whether this override supersedes metadata from this decorator application.
   * Only applications inherited before the transform are superseded. Annotations
   * authored on the transformed copy remain applicable, including new augments.
   */
  supersedes(context: DecoratorContext): boolean;
}

interface OverrideState {
  readonly value: PropertyOptionalityOverride;
  readonly superseded: ReadonlySet<object>;
  readonly transforms: ReadonlyMap<object, object>;
}

interface ApplicationContext {
  readonly origin: object;
  readonly execution: object;
}

const stateKey = Symbol.for("TypeSpec.PropertyOptionality");
interface OptionalityState {
  overrides: WeakMap<ModelProperty, OverrideState>;
  inheritedApplications: WeakMap<ModelProperty, ReadonlySet<object>>;
  applicationOrigins: WeakMap<DecoratorApplication, object>;
  contextOrigins: WeakMap<DecoratorContext, ApplicationContext>;
}
// Like Realm, compiler and typekit instances can cross module boundaries.
const { overrides, inheritedApplications, applicationOrigins, contextOrigins } = ((
  globalThis as typeof globalThis & { [stateKey]?: OptionalityState }
)[stateKey] ??= {
  overrides: new WeakMap(),
  inheritedApplications: new WeakMap(),
  applicationOrigins: new WeakMap(),
  contextOrigins: new WeakMap(),
});

function applicationOrigin(application: DecoratorApplication): object {
  let origin = applicationOrigins.get(application);
  if (!origin) {
    origin = {};
    applicationOrigins.set(application, origin);
  }
  return origin;
}

/** @internal */
export function copyOptionalityDecoratorOrigin(
  source: DecoratorApplication,
  clone: DecoratorApplication,
): void {
  applicationOrigins.set(clone, applicationOrigin(source));
}

/** @internal */
export function registerOptionalityDecoratorContext(
  application: DecoratorApplication,
  ...contexts: DecoratorContext[]
): void {
  const value = { origin: applicationOrigin(application), execution: {} };
  for (const context of contexts) contextOrigins.set(context, value);
}

/** @internal */
export function copyPropertyOptionality(source: ModelProperty, clone: ModelProperty): void {
  if (source.decorators.length > 0) {
    inheritedApplications.set(clone, new Set(source.decorators.map(applicationOrigin)));
  }
  const override = overrides.get(source);
  if (override) overrides.set(clone, override);
}

/**
 * Replace a property's inherited optionality, even when its boolean value does
 * not change. Call on an owned derived property, never a shared source.
 *
 * Decorators must pass their context so replay does not repeat a semantic
 * transform or overwrite a later transform/version realization. Non-decorator
 * transforms omit it. A subsequent explicit override wins.
 *
 * Ordinary `property.optional = value` assignments do not record intent and
 * remain appropriate for realizing version snapshots.
 *
 * @experimental
 */
export function overridePropertyOptionality(
  property: ModelProperty,
  optional: boolean,
  context?: DecoratorContext,
): void {
  const previous = overrides.get(property);
  const application = context && contextOrigins.get(context);
  const origin = application?.origin ?? context;
  const execution = application?.execution ?? context;
  if (origin && previous?.transforms.has(origin) && previous.transforms.get(origin) !== execution) {
    return;
  }

  const superseded = new Set([
    ...(previous?.superseded ?? []),
    ...(inheritedApplications.get(property) ?? []),
  ]);
  const transforms = new Map(previous?.transforms);
  if (origin && execution) transforms.set(origin, execution);

  overrides.set(property, {
    value: Object.freeze({
      optional,
      supersedes: (context: DecoratorContext) => {
        const origin = contextOrigins.get(context)?.origin;
        return origin !== undefined && superseded.has(origin);
      },
    }),
    superseded,
    transforms,
  });
  property.optional = optional;
}

/**
 * Get the explicit semantic override, if any. Compiler and typekit cloning
 * preserve it and its annotation provenance without modifying the source.
 *
 * @experimental
 */
export function getPropertyOptionalityOverride(
  property: ModelProperty,
): PropertyOptionalityOverride | undefined {
  return overrides.get(property)?.value;
}
