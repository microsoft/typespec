import { reportDiagnostic } from "../core/messages.js";
import { parseMimeType } from "../core/mime-type.js";
import type { Program } from "../core/program.js";
import type { DecoratorContext, Enum, Model, Type, Union } from "../core/types.js";
import { DuplicateTracker, useStateMap } from "../utils/index.js";
import { createStateSymbol } from "./utils.js";

const [getEncodedNamesMap, setEncodedNamesMap, getEncodedNamesStateMap] = useStateMap<
  Type,
  Map<string, string>
>(createStateSymbol("encodedName"));

export function $encodedName(
  context: DecoratorContext,
  target: Type,
  mimeType: string,
  name: string,
) {
  let existing = getEncodedNamesMap(context.program, target);
  if (existing === undefined) {
    existing = new Map<string, string>();
    setEncodedNamesMap(context.program, target, existing);
  }
  const mimeTypeObj = parseMimeType(mimeType);

  if (mimeTypeObj === undefined) {
    reportDiagnostic(context.program, {
      code: "invalid-mime-type",
      format: { mimeType },
      target: context.getArgumentTarget(0)!,
    });
  } else if (mimeTypeObj.suffix) {
    reportDiagnostic(context.program, {
      code: "no-mime-type-suffix",
      format: { mimeType, suffix: mimeTypeObj.suffix },
      target: context.getArgumentTarget(0)!,
    });
  }
  existing.set(mimeType, name);
}

function getEncodedName(program: Program, target: Type, mimeType: string): string | undefined {
  const mimeTypeObj = parseMimeType(mimeType);
  if (mimeTypeObj === undefined) {
    return undefined;
  }
  const resolvedMimeType = mimeTypeObj?.suffix
    ? `${mimeTypeObj.type}/${mimeTypeObj.suffix}`
    : mimeType;
  return getEncodedNamesMap(program, target)?.get(resolvedMimeType);
}

/**
 * Resolve the encoded name for the given type when serialized to the given mime type.
 * If a specific value was provided by `@encodedName` decorator for that mime type it will return that otherwise it will return the name of the type.
 *
 * @example
 *
 * For the given
 * ```tsp
 * model Certificate {
 *   @encodedName("application/json", "exp")
 *   @encodedName("application/xml", "expiry")
 *   expireAt: utcDateTime;
 *
 * }
 * ```
 *
 * ```ts
 * resolveEncodedName(program, type, "application/json") // exp
 * resolveEncodedName(program, type, "application/merge-patch+json") // exp
 * resolveEncodedName(program, type, "application/xml") // expireAt
 * resolveEncodedName(program, type, "application/yaml") // expiry
 * ```
 */
export function resolveEncodedName(
  program: Program,
  target: Type & { name: string },
  mimeType: string,
): string {
  return getEncodedName(program, target, mimeType) ?? target.name;
}

/**
 * Validate encoded names for conflicts. Validate the encoded names doesn't encode to an existing property name and that 2 encoded names don't map to the same name for the same mime type.
 * @internal
 */
export function validateEncodedNamesConflicts(program: Program) {
  const duplicateTrackers = new Map<Type, Map<string, DuplicateTracker<string, any>>>();

  function getOrCreateDuplicateTracker(type: Type, mimeType: string) {
    let perMimeTypes = duplicateTrackers.get(type);

    if (perMimeTypes === undefined) {
      perMimeTypes = new Map();
      duplicateTrackers.set(type, perMimeTypes);
    }
    let tracker = perMimeTypes.get(mimeType);

    if (tracker === undefined) {
      tracker = new DuplicateTracker();
      perMimeTypes.set(mimeType, tracker);
    }
    return tracker;
  }

  for (const [target, map] of getEncodedNamesStateMap(program).entries()) {
    const scope = getScope(target);
    const memberValues = new Set(scope?.members.values());
    if (
      scope === undefined ||
      // Workaround: exclude members that aren't actually in the scope. This can happen when types of
      // properties, enum members, or union variants are cloned for one reason or another, but are not
      // actually attached to the parent type. This should probably be fixed in cloning logic (mutator
      // implementation) instead, but for now this workaround solves some problems with false positives
      // in duplication tracking here.
      !memberValues.has(target)
    ) {
      return;
    }
    for (const [mimeType, name] of map.entries()) {
      const duplicateTracker = getOrCreateDuplicateTracker(scope.parent, mimeType);
      duplicateTracker.track(name, target);
      if (scope.members.has(name)) {
        reportDiagnostic(program, {
          code: "encoded-name-conflict",
          format: { name, mimeType },
          target: target,
        });
      }
    }
  }

  for (const perMimeTypes of duplicateTrackers.values()) {
    for (const [mimeType, tracker] of perMimeTypes.entries()) {
      for (const [duplicateName, items] of tracker.entries()) {
        for (const item of items) {
          reportDiagnostic(program, {
            code: "encoded-name-conflict",
            messageId: "duplicate",
            format: { name: duplicateName, mimeType },
            target: item,
          });
        }
      }
    }
  }
}

interface EncodedNameScope {
  parent: Model | Enum | Union;
  members: Map<string | symbol, unknown>;
}
function getScope(type: Type): EncodedNameScope | undefined {
  switch (type.kind) {
    case "ModelProperty":
      return type.model && { parent: type.model, members: type.model.properties };
    case "EnumMember":
      return { parent: type.enum, members: type.enum.members };
    case "UnionVariant":
      return { parent: type.union, members: type.union.variants };
    default:
      return undefined;
  }
}
