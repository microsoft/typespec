import { Discriminator } from "../../lib/decorators.js";
import { createDiagnostic } from "../messages.js";
import { Diagnostic, Model, Type, Union } from "../types.js";
import { isDefined } from "../util.js";

export interface DiscriminatedUnion {
  propertyName: string;
  variants: Map<string, Model>;
}

export function getDiscriminatedUnion(
  type: Model | Union,
  discriminator: Discriminator
): [DiscriminatedUnion, readonly Diagnostic[]] {
  switch (type.kind) {
    case "Model":
      return getDiscriminatedUnionForModel(type, discriminator);
    case "Union":
      return getDiscriminatedUnionForUnion(type, discriminator);
  }
}
function getDiscriminatedUnionForUnion(
  type: Union,
  discriminator: Discriminator
): [DiscriminatedUnion, readonly Diagnostic[]] {
  const variants = new Map<string, Model>();
  const diagnostics: Diagnostic[] = [];
  const duplicates = new DuplicateTracker<string, Model>();

  for (const variant of type.variants.values()) {
    if (variant.type.kind !== "Model") {
      continue;
    }
    const keys = getDiscriminatorValues(variant.type, discriminator, diagnostics);
    if (keys === undefined) {
      diagnostics.push(
        createDiagnostic({
          code: "missing-discriminator-value",
          format: { discriminator: discriminator.propertyName },
          target: variant.type,
        })
      );
    } else {
      for (const key of keys) {
        duplicates.track(key, variant.type);
        variants.set(key, variant.type);
      }
    }
  }
  reportDuplicateDiscriminatorValues(duplicates, diagnostics);

  const discriminatedUnion = {
    propertyName: discriminator.propertyName,
    variants,
  };
  return [discriminatedUnion, diagnostics];
}

function getDiscriminatedUnionForModel(
  type: Model,
  discriminator: Discriminator
): [DiscriminatedUnion, readonly Diagnostic[]] {
  const variants = new Map<string, Model>();
  const diagnostics: Diagnostic[] = [];
  const duplicates = new DuplicateTracker<string, Model>();

  function checkForVariantsIn(current: Model) {
    for (const derivedModel of current.derivedModels) {
      const keys = getDiscriminatorValues(derivedModel, discriminator, diagnostics);
      if (keys === undefined) {
        if (derivedModel.derivedModels.length === 0) {
          diagnostics.push(
            createDiagnostic({
              code: "missing-discriminator-value",
              format: { discriminator: discriminator.propertyName },
              target: derivedModel,
            })
          );
        } else {
          checkForVariantsIn(derivedModel);
        }
      } else {
        for (const key of keys) {
          duplicates.track(key, derivedModel);
          variants.set(key, derivedModel);
        }
      }
    }
  }

  checkForVariantsIn(type);
  reportDuplicateDiscriminatorValues(duplicates, diagnostics);
  const discriminatedUnion = {
    propertyName: discriminator.propertyName,
    variants,
  };

  return [discriminatedUnion, diagnostics];
}

function reportDuplicateDiscriminatorValues(
  duplicates: DuplicateTracker<string, Model>,
  diagnostics: Diagnostic[]
) {
  for (const [duplicateKey, models] of duplicates.entries()) {
    for (const model of models) {
      diagnostics.push(
        createDiagnostic({
          code: "invalid-discriminator-value",
          messageId: "duplicate",
          format: { discriminator: duplicateKey },
          target: model,
        })
      );
    }
  }
}

function getDiscriminatorValues(
  model: Model,
  discriminator: Discriminator,
  diagnostics: Diagnostic[]
): string[] | undefined {
  const prop = model.properties.get(discriminator.propertyName);
  if (prop) {
    if (prop.optional) {
      diagnostics.push(
        createDiagnostic({
          code: "invalid-discriminator-value",
          messageId: "required",
          target: prop,
        })
      );
    }
    const keys = getStringValues(prop.type);
    if (keys.length === 0) {
      diagnostics.push(
        createDiagnostic({
          code: "invalid-discriminator-value",
          format: { kind: prop.type.kind },
          target: prop,
        })
      );
    }
    return keys;
  }
  return undefined;
}
function getStringValues(type: Type): string[] {
  switch (type.kind) {
    case "String":
      return [type.value];
    case "Union":
      return [...type.variants.values()].flatMap((x) => getStringValues(x.type)).filter(isDefined);
    case "EnumMember":
      return typeof type.value !== "number" ? [type.value ?? type.name] : [];
    default:
      return [];
  }
}

/**
 * Helper class to track duplicate instance
 */
export class DuplicateTracker<K, V> {
  #entries = new Map<K, V[]>();

  /**
   * Track usage of K.
   * @param k key that is being checked for duplicate.
   * @param v value that map to the key
   */
  track(k: K, v: V) {
    const existing = this.#entries.get(k);
    if (existing === undefined) {
      this.#entries.set(k, [v]);
    } else {
      existing.push(v);
    }
  }

  /**
   * Return iterator of all the duplicate entries.
   */
  *entries(): Iterable<[K, V[]]> {
    for (const [k, v] of this.#entries.entries()) {
      if (v.length > 1) {
        yield [k, v];
      }
    }
  }
}
