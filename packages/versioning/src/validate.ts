import {
  getNamespaceFullName,
  getTypeName,
  isTemplateInstance,
  Namespace,
  navigateProgram,
  NoTarget,
  Program,
  Type,
} from "@cadl-lang/compiler";
import { reportDiagnostic } from "./lib.js";
import {
  Availability,
  findVersionedNamespace,
  getAvailabilityMap,
  getMadeOptionalOn,
  getUseDependencies,
  getVersionDependencies,
  getVersions,
  Version,
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

  navigateProgram(
    program,
    {
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

          // Validate model property type is correct when madeOptional
          validateMadeOptional(program, prop);
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
        const versionedNamespace = findVersionedNamespace(program, namespace);
        const dependencies = getVersionDependencies(program, namespace);
        if (dependencies === undefined) {
          return;
        }

        for (const [dependencyNs, value] of dependencies.entries()) {
          if (versionedNamespace) {
            const usingUseDependency = getUseDependencies(program, namespace, false) !== undefined;
            if (usingUseDependency) {
              reportDiagnostic(program, {
                code: "incompatible-versioned-namespace-use-dependency",
                target: namespace,
              });
            } else if (!(value instanceof Map)) {
              reportDiagnostic(program, {
                code: "versioned-dependency-record-not-mapping",
                format: { dependency: getNamespaceFullName(dependencyNs) },
                target: namespace,
              });
            }
          } else {
            if (value instanceof Map) {
              reportDiagnostic(program, {
                code: "versioned-dependency-not-picked",
                format: { dependency: getNamespaceFullName(dependencyNs) },
                target: namespace,
              });
            }
          }
        }
      },
      enum: (en) => {
        // construct the list of tuples in the old format if version
        // information is placed in the Version enum members
        const useDependencies = getUseDependencies(program, en);
        if (!useDependencies) {
          return;
        }
        for (const [depNs, deps] of useDependencies) {
          namespaceDependencies.set(depNs, deps);
        }
      },
    },
    { includeTemplateDeclaration: true }
  );
  validateVersionedNamespaceUsage(program, namespaceDependencies);
}

function validateVersionedNamespaceUsage(
  program: Program,
  namespaceDependencies: Map<Namespace | undefined, Set<Namespace>>
) {
  for (const [source, targets] of namespaceDependencies.entries()) {
    const dependencies = source && getVersionDependencies(program, source);
    for (const target of targets) {
      const targetVersionedNamespace = findVersionedNamespace(program, target);

      if (
        targetVersionedNamespace !== undefined &&
        !(source && (isSubNamespace(target, source) || isSubNamespace(source, target))) &&
        dependencies?.get(targetVersionedNamespace) === undefined
      ) {
        reportDiagnostic(program, {
          code: "using-versioned-library",
          format: {
            sourceNs: source ? getNamespaceFullName(source) : "global",
            targetNs: getNamespaceFullName(target),
          },
          target: source ?? NoTarget,
        });
      }
    }
  }
}

function isSubNamespace(parent: Namespace, child: Namespace): boolean {
  let current: Namespace | undefined = child;

  while (current && current.name !== "") {
    if (current === parent) {
      return true;
    }
    current = current.namespace;
  }

  return false;
}

function validateMadeOptional(program: Program, target: Type) {
  if (target.kind === "ModelProperty") {
    const madeOptionalOn = getMadeOptionalOn(program, target);
    if (!madeOptionalOn) {
      return;
    }
    // if the @madeOptional decorator is on a property it MUST be optional
    if (!target.optional) {
      reportDiagnostic(program, {
        code: "made-optional-not-optional",
        format: {
          name: target.name,
        },
        target: target,
      });
      return;
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

function getAvailabilityMapWithParentInfo(
  program: Program,
  type: Type
): Map<string, Availability> | undefined {
  const base = getAvailabilityMap(program, type);

  // get any parent availability information
  let parentMap: Map<string, Availability> | undefined = undefined;
  switch (type.kind) {
    case "Operation":
      const parentInterface = type.interface;
      if (parentInterface) {
        parentMap = getAvailabilityMap(program, parentInterface);
      }
      break;
    case "ModelProperty":
      const parentModel = type.model;
      if (parentModel) {
        parentMap = getAvailabilityMap(program, parentModel);
      }
      break;
    default:
      break;
  }
  if (!base && !parentMap) return undefined;
  else if (!base && parentMap) return parentMap;
  else return base;
}

/**
 * Validate the target versioning is compatible with the versioning of the source.
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
  const sourceAvailability = getAvailabilityMapWithParentInfo(program, source);
  const [sourceNamespace] = getVersions(program, source);

  let targetAvailability = getAvailabilityMapWithParentInfo(program, target);
  const [targetNamespace] = getVersions(program, target);
  if (!targetAvailability || !targetNamespace) return;

  if (sourceNamespace !== targetNamespace) {
    const dependencies = getVersionDependencies(program, (source as any).namespace);
    const versionMap = dependencies?.get(targetNamespace);
    if (versionMap === undefined) return;

    targetAvailability = translateAvailability(
      program,
      targetAvailability,
      versionMap,
      source,
      target
    );
    if (!targetAvailability) {
      return;
    }
  }

  if (validateOptions.isTargetADependent) {
    validateAvailabilityForContains(
      program,
      sourceAvailability,
      targetAvailability,
      source,
      target
    );
  } else {
    validateAvailabilityForRef(program, sourceAvailability, targetAvailability, source, target);
  }
}

function translateAvailability(
  program: Program,
  avail: Map<string, Availability>,
  versionMap: Map<Version, Version> | Version,
  source: Type,
  target: Type
): Map<string, Availability> | undefined {
  if (!(versionMap instanceof Map)) {
    const version = versionMap;
    if ([Availability.Removed, Availability.Unavailable].includes(avail.get(version.name)!)) {
      const addedAfter = findAvailabilityAfterVersion(version.name, Availability.Added, avail);
      const removedBefore = findAvailabilityOnOrBeforeVersion(
        version.name,
        Availability.Removed,
        avail
      );
      if (addedAfter) {
        reportDiagnostic(program, {
          code: "incompatible-versioned-reference",
          messageId: "versionedDependencyAddedAfter",
          format: {
            sourceName: getTypeName(source),
            targetName: getTypeName(target),
            dependencyVersion: prettyVersion(version),
            targetAddedOn: addedAfter,
          },
          target: source,
        });
      }
      if (removedBefore) {
        reportDiagnostic(program, {
          code: "incompatible-versioned-reference",
          messageId: "versionedDependencyRemovedBefore",
          format: {
            sourceName: getTypeName(source),
            targetName: getTypeName(target),
            dependencyVersion: prettyVersion(version),
            targetAddedOn: removedBefore,
          },
          target: source,
        });
      }
    }
    return undefined;
  } else {
    const newAvail = new Map<string, Availability>();
    for (const [key, val] of versionMap) {
      const isAvail = avail.get(val.name)!;
      newAvail.set(key.name, isAvail);
    }
    return newAvail;
  }
}

function findAvailabilityAfterVersion(
  version: string,
  status: Availability,
  avail: Map<string, Availability>
): string | undefined {
  let search = false;
  for (const [key, val] of avail) {
    if (version === key) {
      search = true;
      continue;
    }
    if (!search) continue;
    if (val === status) return key;
  }
  return undefined;
}

function findAvailabilityOnOrBeforeVersion(
  version: string,
  status: Availability,
  avail: Map<string, Availability>
): string | undefined {
  let search = false;
  for (const [key, val] of avail) {
    if ([Availability.Added, Availability.Added].includes(val)) {
      search = true;
    }
    if (!search) continue;
    if (val === status) {
      return key;
    }
    if (key === version) {
      break;
    }
  }
  return undefined;
}

function validateAvailabilityForRef(
  program: Program,
  sourceAvail: Map<string, Availability> | undefined,
  targetAvail: Map<string, Availability>,
  source: Type,
  target: Type
) {
  // if source is unversioned and target is versioned
  if (sourceAvail === undefined) {
    if (!isAvailableInAllVersion(targetAvail)) {
      reportDiagnostic(program, {
        code: "incompatible-versioned-reference",
        messageId: "default",
        format: {
          sourceName: getTypeName(source),
          targetName: getTypeName(target),
        },
        target: source,
      });
    }
    return;
  }

  const keySet = new Set([...sourceAvail.keys(), ...targetAvail.keys()]);

  for (const key of keySet) {
    const sourceVal = sourceAvail.get(key)!;
    const targetVal = targetAvail.get(key)!;
    if (
      [Availability.Added].includes(sourceVal) &&
      [Availability.Removed, Availability.Unavailable].includes(targetVal)
    ) {
      const targetAddedOn = findAvailabilityAfterVersion(key, Availability.Added, targetAvail);
      reportDiagnostic(program, {
        code: "incompatible-versioned-reference",
        messageId: "addedAfter",
        format: {
          sourceName: getTypeName(source),
          targetName: getTypeName(target),
          sourceAddedOn: key,
          targetAddedOn: targetAddedOn!,
        },
        target: source,
      });
    }
    if (
      [Availability.Removed].includes(sourceVal) &&
      [Availability.Unavailable].includes(targetVal)
    ) {
      const targetRemovedOn = findAvailabilityOnOrBeforeVersion(
        key,
        Availability.Removed,
        targetAvail
      );
      reportDiagnostic(program, {
        code: "incompatible-versioned-reference",
        messageId: "removedBefore",
        format: {
          sourceName: getTypeName(source),
          targetName: getTypeName(target),
          sourceRemovedOn: key,
          targetRemovedOn: targetRemovedOn!,
        },
        target: source,
      });
    }
  }
}

function validateAvailabilityForContains(
  program: Program,
  sourceAvail: Map<string, Availability> | undefined,
  targetAvail: Map<string, Availability>,
  source: Type,
  target: Type
) {
  if (!sourceAvail) return;

  const keySet = new Set([...sourceAvail.keys(), ...targetAvail.keys()]);

  for (const key of keySet) {
    const sourceVal = sourceAvail.get(key)!;
    const targetVal = targetAvail.get(key)!;
    if (
      [Availability.Added].includes(targetVal) &&
      [Availability.Removed, Availability.Unavailable].includes(sourceVal)
    ) {
      const sourceAddedOn = findAvailabilityOnOrBeforeVersion(key, Availability.Added, sourceAvail);
      reportDiagnostic(program, {
        code: "incompatible-versioned-reference",
        messageId: "dependentAddedAfter",
        format: {
          sourceName: getTypeName(source),
          targetName: getTypeName(target),
          sourceAddedOn: sourceAddedOn!,
          targetAddedOn: key,
        },
        target: target,
      });
    }
    if (
      [Availability.Removed].includes(sourceVal) &&
      [Availability.Added, Availability.Available].includes(targetVal)
    ) {
      const targetRemovedOn = findAvailabilityAfterVersion(key, Availability.Removed, targetAvail);
      reportDiagnostic(program, {
        code: "incompatible-versioned-reference",
        messageId: "dependentRemovedBefore",
        format: {
          sourceName: getTypeName(source),
          targetName: getTypeName(target),
          sourceRemovedOn: key,
          targetRemovedOn: targetRemovedOn!,
        },
        target: target,
      });
    }
  }
}

function isAvailableInAllVersion(avail: Map<string, Availability>): boolean {
  for (const val of avail.values()) {
    if ([Availability.Removed, Availability.Unavailable].includes(val)) return false;
  }
  return true;
}

function prettyVersion(version: Version | undefined): string {
  return version?.value ?? "<n/a>";
}
