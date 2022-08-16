import {
  isTemplateInstance,
  Namespace,
  navigateProgram,
  NoTarget,
  Program,
  Type,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./lib.js";
import {
  getAddedOn,
  getRemovedOn,
  getVersion,
  getVersionDependencies,
  getVersions,
  Version,
  VersionMap,
} from "./versioning.js";

export function $onValidate(program: Program) {
  const namespaceDependencies = new Map();
  function addDependency(source: Namespace | undefined, target: Type | undefined) {
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
      if (isTemplateInstance(model)) {
        return;
      }
      addDependency(model.namespace, model.baseModel);
      for (const prop of model.properties.values()) {
        addDependency(model.namespace, prop.type);

        // Validate model -> property have correct versioning
        validateTargetVersionCompatible(program, model, prop, { isTargetADependent: true });

        // Validate model property -> type have correct versioning
        validateReference(program, prop, prop.type);
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
        if (version) {
          if (!(value instanceof Map)) {
            reportDiagnostic(program, {
              code: "versioned-dependency-record-not-mapping",
              format: { dependency: program.checker.getNamespaceString(dependencyNs) },
              target: namespace,
            });
          }
        } else {
          if (value instanceof Map) {
            reportDiagnostic(program, {
              code: "versioned-dependency-not-picked",
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
  namespaceDependencies: Map<Namespace | undefined, Set<Namespace>>
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
 * Validate the target reference versioning is compatible with the source versioning.
 * This will also validate any template arguments used in the reference.
 * e.g. The target cannot be added after the source was added.
 * @param source Source type referencing the target type.
 * @param target Type being referenced from the source
 */
function validateReference(program: Program, source: Type, target: Type) {
  validateTargetVersionCompatible(program, source, target);

  if (target.kind === "Model" && target.templateArguments) {
    for (const param of target.templateArguments) {
      validateTargetVersionCompatible(program, source, param);
    }
  }
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
  let targetVersionRange = getResolvedVersionRange(program, target);
  if (targetVersionRange === undefined) {
    return;
  }

  const sourceVersionRange = getResolvedVersionRange(program, source);

  const [sourceNamespace, sourceVersions] = getVersions(program, source);
  const [targetNamespace, _targetVersions] = getVersions(program, target);
  if (sourceNamespace === undefined) {
    return;
  }
  if (targetNamespace === undefined) {
    return;
  }

  if (sourceNamespace !== targetNamespace) {
    const versionMap = getVersionDependencies(program, (source as any).namespace)?.get(
      targetNamespace
    );
    if (versionMap === undefined) {
      return;
    }
    targetVersionRange = translateVersionRange(
      program,
      targetVersionRange,
      versionMap,
      source,
      target
    );
    if (targetVersionRange === undefined) {
      return;
    }
  }

  if (validateOptions.isTargetADependent) {
    validateRangeCompatibleForContains(
      program,
      sourceVersionRange,
      targetVersionRange,
      source,
      target
    );
  } else {
    validateRangeCompatibleForRef(
      program,
      sourceVersions!,
      sourceVersionRange,
      targetVersionRange,
      source,
      target
    );
  }
}

interface VersionRange {
  added: Version | undefined;
  removed: Version | undefined;
}

interface VersionRangeIndex {
  added: number | undefined;
  removed: number | undefined;
}

function translateVersionRange(
  program: Program,
  range: VersionRange,
  versionMap: Map<Version, Version> | Version,
  source: Type,
  target: Type
): VersionRange | undefined {
  if (!(versionMap instanceof Map)) {
    const rangeIndex = getVersionRangeIndex(range);
    const selectedVersionIndex = versionMap.index;
    if (rangeIndex.added !== undefined && rangeIndex.added > selectedVersionIndex) {
      reportDiagnostic(program, {
        code: "incompatible-versioned-reference",
        messageId: "versionedDependencyAddedAfter",
        format: {
          sourceName: program.checker.getTypeName(source),
          targetName: program.checker.getTypeName(target),
          dependencyVersion: prettyVersion(versionMap),
          targetAddedOn: prettyVersion(range.added),
        },
        target: source,
      });
    }
    if (rangeIndex.removed !== undefined && rangeIndex.removed < selectedVersionIndex) {
      reportDiagnostic(program, {
        code: "incompatible-versioned-reference",
        messageId: "versionedDependencyRemovedBefore",
        format: {
          sourceName: program.checker.getTypeName(source),
          targetName: program.checker.getTypeName(target),
          dependencyVersion: prettyVersion(versionMap),
          targetAddedOn: prettyVersion(range.added),
        },
        target: source,
      });
    }
    return undefined;
  } else {
    return {
      added: range.added ? findVersionMapping(versionMap, range.added) : undefined,
      removed: range.removed ? findVersionMapping(versionMap, range.removed) : undefined,
    };
  }
}

function findVersionMapping(
  versionMap: Map<Version, Version>,
  version: Version
): Version | undefined {
  return [...versionMap.entries()].find(([k, v]) => v === version)?.[0];
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

function getVersionRangeIndex(range: VersionRange): VersionRangeIndex {
  const added = range.added ? range.added.index : -1;
  const removed = range.removed ? range.removed.index : -1;
  return {
    added: added !== -1 ? added : undefined,
    removed: removed !== -1 ? removed : undefined,
  };
}

function validateRangeCompatibleForRef(
  program: Program,
  versions: VersionMap,
  sourceRange: VersionRange | undefined,
  targetRange: VersionRange,
  source: Type,
  target: Type
) {
  const targetRangeIndex = getVersionRangeIndex(targetRange);
  if (sourceRange === undefined) {
    if (
      (targetRangeIndex.added && targetRangeIndex.added > 0) ||
      (targetRangeIndex.removed && targetRangeIndex.removed < versions.size)
    ) {
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
  const sourceRangeIndex = getVersionRangeIndex(sourceRange);

  if (
    targetRangeIndex.added !== undefined &&
    (sourceRangeIndex.added === undefined || targetRangeIndex.added > sourceRangeIndex.added)
  ) {
    reportDiagnostic(program, {
      code: "incompatible-versioned-reference",
      messageId: "addedAfter",
      format: {
        sourceName: program.checker.getTypeName(source),
        targetName: program.checker.getTypeName(target),
        sourceAddedOn: prettyVersion(sourceRange.added),
        targetAddedOn: prettyVersion(targetRange.added),
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
      messageId: "removedBefore",
      format: {
        sourceName: program.checker.getTypeName(source),
        targetName: program.checker.getTypeName(target),
        sourceRemovedOn: prettyVersion(sourceRange.removed),
        targetRemovedOn: prettyVersion(targetRange.removed),
      },
      target: source,
    });
  }
}

function validateRangeCompatibleForContains(
  program: Program,
  sourceRange: VersionRange | undefined,
  targetRange: VersionRange,
  source: Type,
  target: Type
) {
  if (sourceRange === undefined) {
    return;
  }

  const sourceRangeIndex = getVersionRangeIndex(sourceRange);
  const targetRangeIndex = getVersionRangeIndex(targetRange);

  if (
    targetRangeIndex.added !== undefined &&
    (sourceRangeIndex.added === undefined || targetRangeIndex.added < sourceRangeIndex.added)
  ) {
    reportDiagnostic(program, {
      code: "incompatible-versioned-reference",
      messageId: "dependentAddedAfter",
      format: {
        sourceName: program.checker.getTypeName(source),
        targetName: program.checker.getTypeName(target),
        sourceAddedOn: prettyVersion(sourceRange.added),
        targetAddedOn: prettyVersion(targetRange.added),
      },
      target: target,
    });
  }
  if (
    targetRangeIndex.removed !== undefined &&
    (sourceRangeIndex.removed === undefined || targetRangeIndex.removed > sourceRangeIndex.removed)
  ) {
    reportDiagnostic(program, {
      code: "incompatible-versioned-reference",
      messageId: "dependentRemovedBefore",
      format: {
        sourceName: program.checker.getTypeName(source),
        targetName: program.checker.getTypeName(target),
        sourceRemovedOn: prettyVersion(sourceRange.removed),
        targetRemovedOn: prettyVersion(targetRange.removed),
      },
      target: target,
    });
  }
}

function prettyVersion(version: Version | undefined): string {
  return version?.value ?? "<n/a>";
}
