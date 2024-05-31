// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { JSONSchemaType } from "@typespec/compiler";
import { JsContext } from "./ctx.js";

/**
 * A map of features to their options types.
 *
 * This interface is meant to be augmented by other modules to add new features.
 *
 * Example:
 *
 * ```ts
 * declare module "./feature.js" {
 *   export interface JsEmitterFeature {
 *     "my-feature": { ... }
 *   }
 * }
 * ```
 */
export interface JsEmitterFeature {}

export const JsEmitterFeatureOptionsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {},
  required: [],
} as object as JSONSchemaType<JsEmitterFeature>;

/**
 * A handler function that is called to emit a feature.
 */
export type JsEmitterFeatureHandler<Options> = (ctx: JsContext, options: Options) => Promise<void>;

const __FEATURE_HANDLERS: Map<string, JsEmitterFeatureHandler<any>> = new Map();

/**
 * Adds a feature to the emitter. The feature will be called if it is enabled
 * in the emitter options.
 *
 * Features should first augment `JsEmitterFeature` with a definition of their
 * options type, then call this function to add the feature runtime.
 *
 * @see JsEmitterFeature
 *
 * The feature name must be unique.
 *
 * @param name - the name of the feature, which must be the name of some feature with an options type in `JsEmitterFeature`.
 * @param optionsSchema - the JSON schema definition for the options of the feature.
 * @param handler - the handler that will be called to invoke the feature.
 */
export function registerFeature<Name extends keyof JsEmitterFeature>(
  name: Name,
  optionsSchema: JSONSchemaType<JsEmitterFeature[Name]>,
  handler: JsEmitterFeatureHandler<JsEmitterFeature[Name]>
) {
  if (__FEATURE_HANDLERS.has(name)) {
    throw new Error(`registerFeature: feature '${name}' already registered`);
  }

  __FEATURE_HANDLERS.set(name, handler);

  JsEmitterFeatureOptionsSchema.properties[name] = optionsSchema;
}

/**
 * Gets the handler for a given feature by name.
 * @param name - the name of the feature.
 * @returns a JsEmitterFeatureHandler that invokes the feature.
 */
export function getFeatureHandler<Name extends keyof JsEmitterFeature>(
  name: Name
): JsEmitterFeatureHandler<JsEmitterFeature[Name]> {
  const h = __FEATURE_HANDLERS.get(name);

  if (!h) throw new Error(`getFeatureHandler: feature '${name}' not registered`);

  return h;
}
