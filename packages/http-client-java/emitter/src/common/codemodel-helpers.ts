// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// The initialization and media-type subset used by the Java code model, adapted
// from @azure-tools/codegen 2.10.1.

type Primitive = string | number | boolean | bigint | symbol | undefined | null;
type FunctionLike = ((...args: never[]) => unknown) | (abstract new (...args: never[]) => unknown);

export type DeepPartial<T> = T extends Primitive | FunctionLike | Date
  ? T
  : T extends Map<infer K, infer V>
    ? DeepPartialMap<K, V>
    : T extends Set<infer U>
      ? DeepPartialSet<U>
      : | {
            [P in keyof T]?: T[P] extends Array<infer U>
              ? Array<DeepPartial<U>>
              : T[P] extends ReadonlyArray<infer V>
                ? ReadonlyArray<DeepPartial<V>>
                : T[P] extends Primitive
                  ? T[P]
                  : DeepPartial<T[P]>;
          }
        | T;

type NDeepPartial<T> = T extends Primitive | FunctionLike | Date
  ? T
  : T extends Map<infer K, infer V>
    ? DeepPartialMap<K, V>
    : T extends Set<infer U>
      ? DeepPartialSet<U>
      : T extends object
        ? {
            [P in keyof T]?: T[P] extends string | number | boolean | null | undefined
              ? T[P]
              : NDeepPartial<T[P]>;
          }
        : Partial<T>;

interface DeepPartialSet<T> extends Set<NDeepPartial<T>> {}
interface DeepPartialMap<K, V> extends Map<NDeepPartial<K>, NDeepPartial<V>> {}

const noExclusions = new Set<string>();

/** Adds object initialization that merges existing containers without cloning referenced models. */
export class Initializer {
  protected apply<T>(...initializers: Array<DeepPartial<T> | undefined>): void {
    for (const initializer of initializers) applyTo(initializer, this, noExclusions);
  }

  protected applyWithExclusions<T>(
    exclusions: Array<string>,
    ...initializers: Array<DeepPartial<T> | undefined>
  ): void {
    const filter = new Set(exclusions);
    for (const initializer of initializers) applyTo(initializer, this, filter);
  }

  protected applyTo<T extends object>(
    target: T,
    ...initializers: Array<DeepPartial<T> | undefined>
  ): void {
    for (const initializer of initializers) applyTo(initializer, target, noExclusions);
  }
}

function applyTo(
  source: unknown,
  target: object | null,
  exclusions: ReadonlySet<string>,
  ancestors = new Set<unknown>(),
): void {
  if (ancestors.has(source)) {
    throw new Error("Circular refrenced models are not permitted in apply() initializers.");
  }
  const input = source as Record<string, unknown> | null | undefined;
  const output = target as Record<string, unknown>;
  for (const key of Object.keys(input ?? {})) {
    if (exclusions.has(key)) continue;
    const value = input![key];
    const current = output[key];
    if (typeof value === "object" && value !== null && typeof current === "object") {
      ancestors.add(source);
      try {
        applyTo(value, current, exclusions, ancestors);
      } finally {
        ancestors.delete(source);
      }
    } else {
      output[key] = value;
    }
  }
}

export enum KnownMediaType {
  Json = "json",
  Xml = "xml",
  Form = "form",
  Binary = "binary",
  Multipart = "multipart",
  Text = "text",
  Unknown = "unknown",
}
