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
import { getCachedNamespaceDependencies } from "./validate.js";
import { TimelineMoment, VersioningTimeline } from "./versioning-timeline.js";

/**
 * Gets dependency version selections, combining explicit `@useDependency`
 * metadata with namespace references collected during validation.
 * A referenced versioned namespace without an explicit selection uses its last
 * enum member, not the greatest enum value.
 *
 * Returns `undefined` when neither explicit metadata nor cached usage exists.
 * Result maps contain shared version objects and should be treated as read-only.
 */
export function getVersionDependencies(
  program: Program,
  namespace: Namespace,
): Map<Namespace, Map<Version, Version> | Version> | undefined {
  const explicit = getUseDependencies(program, namespace);
  const base = getCachedNamespaceDependencies(program);
  const usage = base?.get(namespace);
  if (usage === undefined) {
    return explicit;
  }
  const result = new Map<Namespace, Map<Version, Version> | Version>(explicit);

  for (const dep of usage) {
    if (!explicit?.has(dep)) {
      const version = getVersion(program, dep);
      if (version) {
        const depVersions = version.getVersions();
        result.set(dep, depVersions[depVersions.length - 1]);
      }
    }
  }
  return result;
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

      const dependencyVersion =
        versionMap instanceof Map ? versionMap.get(currentVersion) : versionMap;
      namespacesToCheck.push([dependencyNs, dependencyVersion]);
      resolutions.set(dependencyNs, dependencyVersion);
    }
  }

  return resolutions;
}
/**
 * Resolves the root and transitive dependency versions for each root version,
 * in version enum order. An unversioned root produces one resolution with an
 * undefined `rootVersion`; its map is empty when there are no versioned dependencies.
 *
 * Resolution reads metadata without applying a snapshot or changing source types.
 * @param namespace Root namespace whose version selections should be resolved.
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

/**
 * Gets the version map registered directly on the enum's containing namespace.
 * Returns an empty tuple when the enum has no namespace or that namespace is
 * not directly versioned. This does not verify that the enum is the registered version enum.
 */
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

/**
 * Finds the namespace and version map associated with a type.
 * Members follow their containing declaration, and copied properties follow
 * `sourceProperty`. A namespace can inherit its parent's version map while
 * remaining the namespace returned in the tuple.
 *
 * An empty tuple means the type has no applicable namespace. The second tuple
 * element can be `undefined` at runtime for an unversioned namespace, despite
 * the declared return type. Treat the cached tuple and version map as read-only.
 */
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

/**
 * Gets versions registered directly on the namespace returned by {@link getVersions}.
 * Returns `undefined` when that namespace has no direct version registration,
 * even if `getVersions` found an inherited map. The new array is in enum order
 * and contains shared version objects.
 */
export function getAllVersions(p: Program, t: Type): Version[] | undefined {
  const [namespace, _] = getVersions(p, t);
  if (namespace === undefined) return undefined;

  return getVersion(p, namespace)?.getVersions();
}

/** Presence of a type at a version, distinguishing change boundaries from continuing states. */
export enum Availability {
  /** Absent at this version, without a removal occurring at this version. */
  Unavailable = "Unavailable",
  /** Becomes available at this version, including a re-addition after removal. */
  Added = "Added",
  /** Remains available after an earlier addition. */
  Available = "Available",
  /** Becomes unavailable at this version; removal takes effect immediately. */
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

function getParentRemovedVersion(
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
    if (value === Availability.Removed) {
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

function resolveRemoved(added: Version[], removed: Version[], parentRemoved?: Version): Version[] {
  if (removed.length) {
    return removed;
  }

  const implicitlyRemoved =
    !added.length || (parentRemoved && added[0].index < parentRemoved.index);
  if (parentRemoved && implicitlyRemoved) {
    return [parentRemoved];
  }

  return [];
}

/**
 * Computes availability keyed by version enum member name, in enum order.
 * Returns `undefined` when no direct version list is available or the type has
 * no addition, removal, property-type-change, or return-type-change metadata.
 * Absence of a map is not evidence that the type is unavailable.
 *
 * Addition boundaries can be inferred from a containing model or interface,
 * and a parent's removal is used when no explicit removal is recorded.
 * The returned map is newly allocated.
 */
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
  const parentRemoved = getParentRemovedVersion(program, type, allVersions);
  let added = getAddedOnVersions(program, type) ?? [];
  let removed = getRemovedOnVersions(program, type) ?? [];
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
  removed = resolveRemoved(added, removed, parentRemoved);

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

/**
 * Computes availability across a combined dependency timeline, using the
 * timeline's moment objects as keys in timeline order.
 * Returns `undefined` when no addition, removal, or type-change metadata applies
 * to the timeline; renames and optionality changes alone do not create a map.
 *
 * An implicit first addition can follow the containing model or interface.
 * Unlike {@link getAvailabilityMap}, parent removal is not inferred here.
 * The newly allocated map contains entries for every moment, not just the
 * versions declared by the type's namespace.
 */
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

  // Only keep versioning info related to this timeline
  const timelineAdded = added.filter((x) => timeline.getIndex(x) !== -1);
  const timelineRemoved = removed.filter((x) => timeline.getIndex(x) !== -1);
  const hasTypeChangedInTimeline =
    typeChanged !== undefined && [...typeChanged.keys()].some((v) => timeline.getIndex(v) !== -1);
  const hasReturnTypeChangedInTimeline =
    returnTypeChanged !== undefined &&
    [...returnTypeChanged.keys()].some((v) => timeline.getIndex(v) !== -1);

  if (
    !timelineAdded.length &&
    !timelineRemoved.length &&
    !hasTypeChangedInTimeline &&
    !hasReturnTypeChangedInTimeline
  )
    return undefined;

  added = resolveWhenFirstAdded(timelineAdded, timelineRemoved, parentAdded);

  // something isn't available by default
  let isAvail = false;
  for (const [index, moment] of timeline.entries()) {
    const add = added.find((x) => timeline.getIndex(x) === index);
    const rem = timelineRemoved.find((x) => timeline.getIndex(x) === index);
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

/**
 * Gets the shared version metadata for a member of a namespace's registered
 * version enum. Returns `undefined` if no registration contains this exact
 * member; matching a name or enum value is not sufficient.
 */
export function getVersionForEnumMember(program: Program, member: EnumMember): Version | undefined {
  // Always lookup for the original type. This ensure reference equality when comparing versions.
  const parentEnum = member.enum;
  const [, versions] = getVersionsForEnum(program, parentEnum);
  return versions?.getVersionForEnumMember(member);
}
