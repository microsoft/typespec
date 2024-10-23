import {
  getNamespaceFullName,
  type Enum,
  type EnumMember,
  type Namespace,
  type Program,
  type Type,
} from "@typespec/compiler";
import {
  getAddedOnVersions,
  getRemovedOnVersions,
  getReturnTypeChangedFrom,
  getTypeChangedFrom,
  getUseDependencies,
  getVersion,
  type VersionMap,
} from "./decorators.js";
import type { Version, VersionResolution } from "./types.js";
import { TimelineMoment, VersioningTimeline } from "./versioning-timeline.js";

export function getVersionDependencies(
  program: Program,
  namespace: Namespace,
): Map<Namespace, Map<Version, Version> | Version> | undefined {
  const useDeps = getUseDependencies(program, namespace);
  if (useDeps) {
    return useDeps;
  }

  return undefined;
}

/**
 * Resolve the version of dependencies
 * @param initialResolutions
 */
function resolveDependencyVersions(
  program: Program,
  initialResolutions: Map<Namespace, Version>,
): Map<Namespace, Version> {
  const resolutions = new Map(initialResolutions);
  const namespacesToCheck = [...initialResolutions.entries()];
  while (namespacesToCheck.length > 0) {
    const [current, currentVersion] = namespacesToCheck.pop()!;
    const dependencies = getVersionDependencies(program, current);
    for (const [dependencyNs, versionMap] of dependencies ?? new Map()) {
      if (resolutions.has(dependencyNs)) {
        continue; // Already resolved.
      }

      if (!(versionMap instanceof Map)) {
        const rootNsName = getNamespaceFullName(current);
        const dependencyNsName = getNamespaceFullName(dependencyNs);
        throw new Error(
          `Unexpected error: Namespace ${rootNsName} version dependency to ${dependencyNsName} should be a mapping of version.`,
        );
      }
      const dependencyVersion = versionMap.get(currentVersion);
      namespacesToCheck.push([dependencyNs, dependencyVersion]);
      resolutions.set(dependencyNs, dependencyVersion);
    }
  }

  return resolutions;
}
/**
 * Resolve the version to use for all namespace for each of the root namespace versions.
 * @param program
 * @param rootNs Root namespace.
 */
export function resolveVersions(program: Program, namespace: Namespace): VersionResolution[] {
  const [rootNs, versions] = getVersions(program, namespace);
  const dependencies =
    (rootNs && getVersionDependencies(program, rootNs)) ??
    new Map<Namespace, Map<Version, Version> | Version>();
  if (!versions) {
    if (dependencies.size === 0) {
      return [{ rootVersion: undefined, versions: new Map() }];
    } else {
      const map = new Map();
      for (const [dependencyNs, version] of dependencies) {
        if (version instanceof Map) {
          const rootNsName = getNamespaceFullName(namespace);
          const dependencyNsName = getNamespaceFullName(dependencyNs);
          throw new Error(
            `Unexpected error: Namespace ${rootNsName} version dependency to ${dependencyNsName} should be a picked version.`,
          );
        }
        map.set(dependencyNs, version);
      }
      return [{ rootVersion: undefined, versions: resolveDependencyVersions(program, map) }];
    }
  } else {
    return versions.getVersions().map((version) => {
      const resolutions = resolveDependencyVersions(program, new Map([[rootNs!, version]]));
      return {
        rootVersion: version,
        versions: resolutions,
      };
    });
  }
}

const versionCache = new WeakMap<Type, [Namespace, VersionMap] | []>();
function cacheVersion(key: Type, versions: [Namespace, VersionMap] | []) {
  versionCache.set(key, versions);
  return versions;
}

export function getVersionsForEnum(program: Program, en: Enum): [Namespace, VersionMap] | [] {
  const namespace = en.namespace;

  if (namespace === undefined) {
    return [];
  }
  const nsVersion = getVersion(program, namespace);

  if (nsVersion === undefined) {
    return [];
  }
  return [namespace, nsVersion];
}

export function getVersions(p: Program, t: Type): [Namespace, VersionMap] | [] {
  const existing = versionCache.get(t);
  if (existing) {
    return existing;
  }

  switch (t.kind) {
    case "Namespace":
      return resolveVersionsForNamespace(p, t);
    case "Operation":
    case "Interface":
    case "Model":
    case "Union":
    case "Scalar":
    case "Enum":
      if (t.namespace) {
        return cacheVersion(t, getVersions(p, t.namespace) || []);
      } else if (t.kind === "Operation" && t.interface) {
        return cacheVersion(t, getVersions(p, t.interface) || []);
      } else {
        return cacheVersion(t, []);
      }
    case "ModelProperty":
      if (t.sourceProperty) {
        return getVersions(p, t.sourceProperty);
      } else if (t.model) {
        return getVersions(p, t.model);
      } else {
        return cacheVersion(t, []);
      }
    case "EnumMember":
      return cacheVersion(t, getVersions(p, t.enum) || []);
    case "UnionVariant":
      return cacheVersion(t, getVersions(p, t.union) || []);
    default:
      return cacheVersion(t, []);
  }
}

function resolveVersionsForNamespace(
  program: Program,
  namespace: Namespace,
): [Namespace, VersionMap] | [] {
  const nsVersion = getVersion(program, namespace);

  if (nsVersion !== undefined) {
    return cacheVersion(namespace, [namespace, nsVersion]);
  }

  const parentNamespaceVersion =
    namespace.namespace && getVersions(program, namespace.namespace)[1];
  const hasDependencies = getUseDependencies(program, namespace);

  if (parentNamespaceVersion || hasDependencies) {
    return cacheVersion(namespace, [namespace, parentNamespaceVersion!]);
  } else {
    return cacheVersion(namespace, [namespace, undefined!]);
  }
}

function getAllVersions(p: Program, t: Type): Version[] | undefined {
  const [namespace, _] = getVersions(p, t);
  if (namespace === undefined) return undefined;

  return getVersion(p, namespace)?.getVersions();
}

export enum Availability {
  Unavailable = "Unavailable",
  Added = "Added",
  Available = "Available",
  Removed = "Removed",
}

function getParentAddedVersion(
  program: Program,
  type: Type,
  versions: Version[],
): Version | undefined {
  let parentMap: Map<string, Availability> | undefined = undefined;
  if (type.kind === "ModelProperty" && type.model !== undefined) {
    parentMap = getAvailabilityMap(program, type.model);
  } else if (type.kind === "Operation" && type.interface !== undefined) {
    parentMap = getAvailabilityMap(program, type.interface);
  }
  if (parentMap === undefined) return undefined;
  for (const [key, value] of parentMap.entries()) {
    if (value === Availability.Added) {
      return versions.find((x) => x.name === key);
    }
  }
  return undefined;
}

function getParentAddedVersionInTimeline(
  program: Program,
  type: Type,
  timeline: VersioningTimeline,
): Version | undefined {
  let parentMap: Map<TimelineMoment, Availability> | undefined = undefined;
  if (type.kind === "ModelProperty" && type.model !== undefined) {
    parentMap = getAvailabilityMapInTimeline(program, type.model, timeline);
  } else if (type.kind === "Operation" && type.interface !== undefined) {
    parentMap = getAvailabilityMapInTimeline(program, type.interface, timeline);
  }
  if (parentMap === undefined) return undefined;
  for (const [moment, availability] of parentMap.entries()) {
    if (availability === Availability.Added) {
      return moment.versions().next().value;
    }
  }
  return undefined;
}

/**
 * Uses the added, removed and parent metadata to resolve any issues with
 * implicit versioning and return the added array with this taken into account.
 * @param added the array of versions from the `@added` decorator
 * @param removed the array of versions from the `@removed` decorator
 * @param parentAdded the version when the parent type was added
 * @returns the added array, with any implicit versioning taken into consideration.
 */
function resolveWhenFirstAdded(
  added: Version[],
  removed: Version[],
  parentAdded: Version,
): Version[] {
  const implicitlyAvailable = !added.length && !removed.length;
  if (implicitlyAvailable) {
    // if type has no version info, it inherits from the parent
    return [parentAdded];
  }

  if (added.length) {
    const addedFirst = !removed.length || added[0].index < removed[0].index;
    if (addedFirst) {
      // if the type was added first, then implicitly it wasn't available before
      // and thus should NOT inherit from its parent
      return added;
    }
  }

  if (removed.length) {
    const removedFirst = !added.length || removed[0].index < added[0].index;
    if (removedFirst) {
      // if the type was removed first the implicitly it was available before
      // and thus SHOULD inherit from its parent
      return [parentAdded, ...added];
    }
  }
  // we shouldn't get here, but if we do, then make no change to the added array
  return added;
}

export function getAvailabilityMap(
  program: Program,
  type: Type,
): Map<string, Availability> | undefined {
  const avail = new Map<string, Availability>();

  const allVersions = getAllVersions(program, type);
  // if unversioned then everything exists
  if (allVersions === undefined) return undefined;

  const firstVersion = allVersions[0];
  const parentAdded = getParentAddedVersion(program, type, allVersions) ?? firstVersion;
  let added = getAddedOnVersions(program, type) ?? [];
  const removed = getRemovedOnVersions(program, type) ?? [];
  const typeChanged = getTypeChangedFrom(program, type);
  const returnTypeChanged = getReturnTypeChangedFrom(program, type);
  // if there's absolutely no versioning information, return undefined
  // contextually, this might mean it inherits its versioning info from a parent
  // or that it is treated as unversioned
  if (
    !added.length &&
    !removed.length &&
    typeChanged === undefined &&
    returnTypeChanged === undefined
  )
    return undefined;

  added = resolveWhenFirstAdded(added, removed, parentAdded);

  // something isn't available by default
  let isAvail = false;
  for (const ver of allVersions) {
    const add = added.find((x) => x.index === ver.index);
    const rem = removed.find((x) => x.index === ver.index);
    if (rem) {
      isAvail = false;
      avail.set(ver.name, Availability.Removed);
    } else if (add) {
      isAvail = true;
      avail.set(ver.name, Availability.Added);
    } else if (isAvail) {
      avail.set(ver.name, Availability.Available);
    } else {
      avail.set(ver.name, Availability.Unavailable);
    }
  }
  return avail;
}

export function getAvailabilityMapInTimeline(
  program: Program,
  type: Type,
  timeline: VersioningTimeline,
): Map<TimelineMoment, Availability> | undefined {
  const avail = new Map<TimelineMoment, Availability>();

  const firstVersion = timeline.first().versions().next().value;
  const parentAdded = getParentAddedVersionInTimeline(program, type, timeline) ?? firstVersion;
  let added = getAddedOnVersions(program, type) ?? [];
  const removed = getRemovedOnVersions(program, type) ?? [];
  const typeChanged = getTypeChangedFrom(program, type);
  const returnTypeChanged = getReturnTypeChangedFrom(program, type);
  // if there's absolutely no versioning information, return undefined
  // contextually, this might mean it inherits its versioning info from a parent
  // or that it is treated as unversioned
  if (
    !added.length &&
    !removed.length &&
    typeChanged === undefined &&
    returnTypeChanged === undefined
  )
    return undefined;

  added = resolveWhenFirstAdded(added, removed, parentAdded);

  // something isn't available by default
  let isAvail = false;
  for (const [index, moment] of timeline.entries()) {
    const add = added.find((x) => timeline.getIndex(x) === index);
    const rem = removed.find((x) => timeline.getIndex(x) === index);
    if (rem) {
      isAvail = false;
      avail.set(moment, Availability.Removed);
    } else if (add) {
      isAvail = true;
      avail.set(moment, Availability.Added);
    } else if (isAvail) {
      avail.set(moment, Availability.Available);
    } else {
      avail.set(moment, Availability.Unavailable);
    }
  }
  return avail;
}

export function getVersionForEnumMember(program: Program, member: EnumMember): Version | undefined {
  // Always lookup for the original type. This ensure reference equality when comparing versions.
  member = (member.projectionBase as EnumMember) ?? member;
  const parentEnum = member.enum;
  const [, versions] = getVersionsForEnum(program, parentEnum);
  return versions?.getVersionForEnumMember(member);
}
