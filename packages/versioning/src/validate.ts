import { NamespaceType, navigateProgram, NoTarget, Program, Type } from "@cadl-lang/compiler";
import { reportDiagnostic } from "./lib.js";
import {
  getAddedOn,
  getRemovedOn,
  getVersion,
  getVersionDependencies,
  getVersions,
} from "./versioning.js";

export function $onValidate(program: Program) {
  const namespaceDependencies = new Map();
  function addDependency(source: NamespaceType | undefined, target: Type | undefined) {
    if (target === undefined || !("namespace" in target) || target.namespace === undefined) {
      return;
    }
    let set = namespaceDependencies.get(source);
    if (set === undefined) {
      set = new Set();
      namespaceDependencies.set(source, set);
    }
    if (target.namespace !== source) {
      set.add(target.namespace);
    }
  }

  navigateProgram(program, {
    model: (model) => {
      // If this is an instantiated type we don't want to keep the mapping.
      if (model.templateArguments && model.templateArguments.length > 0) {
        return;
      }
      addDependency(model.namespace, model.baseModel);
      for (const prop of model.properties.values()) {
        addDependency(model.namespace, prop.type);

        // Validate model -> property have correct versioning
        validateTargetVersionCompatible(program, prop, model, { isTargetADependent: true });

        // Validate model property -> type have correct versioning
        validateTargetVersionCompatible(program, prop, prop.type);
      }
    },
    union: (union) => {
      if (union.namespace === undefined) {
        return;
      }
      for (const option of union.options.values()) {
        addDependency(union.namespace, option);
      }
    },
    operation: (op) => {
      const namespace = op.namespace ?? op.interface?.namespace;
      addDependency(namespace, op.parameters);
      addDependency(namespace, op.returnType);

      if (op.interface) {
        // Validate model -> property have correct versioning
        validateTargetVersionCompatible(program, op.interface, op, { isTargetADependent: true });
      }
      validateTargetVersionCompatible(program, op, op.returnType);
    },
    namespace: (namespace) => {
      const version = getVersion(program, namespace);
      const dependencies = getVersionDependencies(program, namespace);
      if (dependencies === undefined) {
        return;
      }

      for (const [dependencyNs, value] of dependencies.entries()) {
        if (version && version.length > 0) {
          if (!(value instanceof Map)) {
            reportDiagnostic(program, {
              code: "versioned-dependency-record-not-model",
              format: { dependency: program.checker.getNamespaceString(dependencyNs) },
              target: namespace,
            });
          }
        } else {
          if (typeof value !== "string") {
            reportDiagnostic(program, {
              code: "versioned-dependency-not-string",
              format: { dependency: program.checker.getNamespaceString(dependencyNs) },
              target: namespace,
            });
          }
        }
      }
    },
  });
  validateVersionedNamespaceUsage(program, namespaceDependencies);
}

function validateVersionedNamespaceUsage(
  program: Program,
  namespaceDependencies: Map<NamespaceType | undefined, Set<NamespaceType>>
) {
  for (const [source, targets] of namespaceDependencies.entries()) {
    const dependencies = source && getVersionDependencies(program, source);
    for (const target of targets) {
      const targetVersions = getVersion(program, target);

      if (targetVersions !== undefined && dependencies?.get(target) === undefined) {
        reportDiagnostic(program, {
          code: "using-versioned-library",
          format: {
            sourceNs: program.checker.getNamespaceString(source),
            targetNs: program.checker.getNamespaceString(target),
          },
          target: source ?? NoTarget,
        });
      }
    }
  }
}

interface IncompatibleVersionValidateOptions {
  isTargetADependent?: boolean;
}

/**
 * Validate the target versioning is compatible with the versioning of the soruce.
 * e.g. The target cannot be added after the source was added.
 * @param source Source type referencing the target type.
 * @param target Type being referenced from the source
 */
function validateTargetVersionCompatible(
  program: Program,
  source: Type,
  target: Type,
  validateOptions: IncompatibleVersionValidateOptions = {}
) {
  const targetVersionRange = getResolvedVersionRange(program, target);
  if (targetVersionRange === undefined) {
    return;
  }

  const sourceVersionRange = getResolvedVersionRange(program, source);

  if (sourceVersionRange === undefined) {
    if (!validateOptions.isTargetADependent) {
      reportDiagnostic(program, {
        code: "incompatible-versioned-reference",
        messageId: "default",
        format: {
          sourceName: program.checker.getTypeName(source),
          targetName: program.checker.getTypeName(target),
        },
        target: source,
      });
    }
    return;
  }
  const [sourceNamespace, sourceVersions] = getVersions(program, source);
  const [targetNamespace, targetVersions] = getVersions(program, target);
  if (sourceNamespace !== targetNamespace) {
    // TODO: resolve version mapping
    return;
  }

  validateRangeCompatible(
    program,
    sourceVersions!,
    sourceVersionRange,
    targetVersionRange,
    source,
    target,
    validateOptions
  );
}

interface VersionRange {
  added: string | undefined;
  removed: string | undefined;
}
interface VersionRangeIndex {
  added: number | undefined;
  removed: number | undefined;
}

function getVersionRange(program: Program, type: Type): VersionRange | undefined {
  const addedOn = getAddedOn(program, type);
  const removedOn = getRemovedOn(program, type);

  if (addedOn === undefined && removedOn === undefined) {
    return undefined;
  }
  return { added: addedOn, removed: removedOn };
}

/**
 * Resolve the version range when the given type is to be included. This include looking up in the parent interface or model for versioning information.
 * @param program Program
 * @param type Type to resolve the version range from.
 * @returns A version range specifying when this type was added and removed.
 */
function getResolvedVersionRange(program: Program, type: Type): VersionRange | undefined {
  const range = getVersionRange(program, type);
  switch (type.kind) {
    case "Operation":
      return mergeRanges(
        range,
        type.interface ? getResolvedVersionRange(program, type.interface) : undefined
      );
    case "ModelProperty":
      return mergeRanges(
        range,
        type.model ? getResolvedVersionRange(program, type.model) : undefined
      );
    default:
      return range;
  }
}

function mergeRanges(
  base: VersionRange | undefined,
  parent: VersionRange | undefined
): VersionRange | undefined {
  if (parent === undefined) {
    return base;
  }
  if (base === undefined) {
    return parent;
  }

  return {
    added: base.added ?? parent.added,
    removed: base.removed ?? parent.removed,
  };
}

function getVersionRangeIndex(versions: string[], range: VersionRange): VersionRangeIndex {
  const added = range.added ? versions.indexOf(range.added) : -1;
  const removed = range.removed ? versions.indexOf(range.removed) : -1;
  return {
    added: added !== -1 ? added : undefined,
    removed: removed !== -1 ? removed : undefined,
  };
}

function validateRangeCompatible(
  program: Program,
  versions: string[],
  sourceRange: VersionRange,
  targetRange: VersionRange,
  source: Type,
  target: Type,
  validateOptions: IncompatibleVersionValidateOptions
) {
  const sourceRangeIndex = getVersionRangeIndex(versions, sourceRange);
  const targetRangeIndex = getVersionRangeIndex(versions, targetRange);

  if (
    targetRangeIndex.added !== undefined &&
    (sourceRangeIndex.added === undefined || targetRangeIndex.added > sourceRangeIndex.added)
  ) {
    reportDiagnostic(program, {
      code: "incompatible-versioned-reference",
      messageId: validateOptions.isTargetADependent ? "dependentAddedAfter" : "addedAfter",
      format: {
        sourceName: program.checker.getTypeName(source),
        targetName: program.checker.getTypeName(target),
        sourceAddedOn: sourceRange.added ?? "<n/a>",
        targetAddedOn: targetRange.added!,
      },
      target: source,
    });
  }
  if (
    targetRangeIndex.removed !== undefined &&
    (sourceRangeIndex.removed === undefined || targetRangeIndex.removed < sourceRangeIndex.removed)
  ) {
    reportDiagnostic(program, {
      code: "incompatible-versioned-reference",
      messageId: validateOptions.isTargetADependent ? "dependentRemovedBefore" : "removedBefore",
      format: {
        sourceName: program.checker.getTypeName(source),
        targetName: program.checker.getTypeName(target),
        sourceRemovedOn: sourceRange.removed ?? "<n/a>",
        targetRemovedOn: sourceRange.removed!,
      },
      target: source,
    });
  }
}
