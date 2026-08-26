import type { ModelProperty, Namespace, Operation, Program, Type } from "@typespec/compiler";
import { type unsafe_MutatorWithNamespace as MutatorWithNamespace } from "@typespec/compiler/experimental";
import {
  getMadeOptionalOn,
  getMadeRequiredOn,
  getRenamedFrom,
  getReturnTypeChangedFrom,
  getTypeChangedFrom,
} from "./decorators.js";
import type { Version } from "./types.js";
import { VersioningTimeline, type TimelineMoment } from "./versioning-timeline.js";
import { Availability, getAvailabilityMapInTimeline, resolveVersions } from "./versioning.js";

/**
 * When the service is versioned.
 */
export interface VersionedMutators {
  readonly kind: "versioned";
  readonly snapshots: VersionSnapshotMutation[];
}

/** Mutator to mutate the service to the specific version. */
export interface VersionSnapshotMutation {
  readonly version: Version;
  readonly mutator: MutatorWithNamespace;
}

/**
 * When the service itself is not versioned but use specific version from another library.
 */
export interface TransientVersioningMutator {
  readonly kind: "transient";
  readonly mutator: MutatorWithNamespace;
}

/**
 * Resolve the set of mutators needed to apply versioning to the service.
 * @returns either:
 *   - VersionedMutators when the service is versioned.
 *   - TransientVersioningMutator when the service is not versioned but use specific version from another library.
 *   - undefined when the service is not versioned.
 */
export function getVersioningMutators(
  program: Program,
  namespace: Namespace,
): VersionedMutators | TransientVersioningMutator | undefined {
  const versions = resolveVersions(program, namespace);
  const timeline = new VersioningTimeline(
    program,
    versions.map((x) => x.versions),
  );
  const helper = new VersioningHelper(program, timeline);
  if (
    versions.length === 1 &&
    versions[0].rootVersion === undefined &&
    versions[0].versions.size > 0
  ) {
    return {
      kind: "transient",
      mutator: createVersionMutator(
        helper,
        timeline.get(versions[0].versions.values().next().value!),
      ),
    };
  }
  const snapshots: VersionSnapshotMutation[] = versions
    .map((resolution) => {
      if (resolution.versions.size === 0) {
        return undefined;
      } else {
        return {
          version: resolution.rootVersion!,
          mutator: createVersionMutator(
            helper,
            timeline.get(resolution.versions.values().next().value!),
          ),
        };
      }
    })
    .filter((x) => x !== undefined);
  if (snapshots.length === 0) {
    return undefined;
  }
  return {
    kind: "versioned",
    snapshots,
  };
}

export function createVersionMutator(
  versioning: VersioningHelper,
  moment: TimelineMoment,
): MutatorWithNamespace {
  function deleteFromMap<T extends Map<string | symbol, NameableType>>(map: T) {
    for (const [name, type] of map) {
      if (!versioning.existsAtVersion(type, moment)) {
        map.delete(name);
      }
    }
  }
  function deleteFromArray<T extends Array<NameableType>>(array: T) {
    for (let i = array.length - 1; i >= 0; i--) {
      if (!versioning.existsAtVersion(array[i], moment)) {
        array.splice(i, 1);
      }
    }
  }

  function rename(original: NameableType, type: NameableType) {
    if (type.name !== undefined) {
      const nameAtVersion = versioning.getNameAtVersion(original, moment);
      if (nameAtVersion !== undefined && nameAtVersion !== type.name) {
        type.name = nameAtVersion;
      }
    }
  }
  return {
    name: `VersionSnapshot ${moment.name}`,
    Namespace: {
      mutate: (original, clone, p, realm) => {
        deleteFromMap(clone.models);
        deleteFromMap(clone.operations);
        deleteFromMap(clone.interfaces);
        deleteFromMap(clone.enums);
        deleteFromMap(clone.unions);
        deleteFromMap(clone.namespaces);
        deleteFromMap(clone.scalars);
      },
    },
    Interface: (original, clone, p, realm) => {
      rename(original, clone);
      deleteFromMap(clone.operations);
    },
    Model: (original, clone, p, realm) => {
      rename(original, clone);
      deleteFromMap(clone.properties);
      deleteFromArray(clone.derivedModels);
    },
    Union: (original, clone, p, realm) => {
      rename(original, clone);
      deleteFromMap(clone.variants);
    },
    UnionVariant: (original, clone, p, realm) => {
      rename(original, clone);
    },
    Enum: (original, clone, p, realm) => {
      rename(original, clone);
      deleteFromMap(clone.members);
    },
    Scalar: (original, clone, p, realm) => {
      rename(original, clone);
      deleteFromArray(clone.derivedScalars);
    },
    EnumMember: (original, clone, p, realm) => {
      rename(original, clone);
    },
    Operation: (original, clone, p, realm) => {
      rename(original, clone);
      const returnTypeAtVersion = versioning.getReturnTypeAtVersion(original, moment);
      if (returnTypeAtVersion !== clone.returnType) {
        clone.returnType = returnTypeAtVersion;
      }
    },
    Tuple: (original, clone, p, realm) => {},
    ModelProperty: (original, clone, p, realm) => {
      rename(original, clone);
      clone.optional = versioning.getOptionalAtVersion(original, moment);
      const typeAtVersion = versioning.getTypeAtVersion(original, moment);
      if (typeAtVersion !== clone.type) {
        clone.type = typeAtVersion;
      }
    },
  };
}

class VersioningHelper {
  #program: Program;
  #timeline: VersioningTimeline;

  constructor(program: Program, timeline: VersioningTimeline) {
    this.#program = program;
    this.#timeline = timeline;
  }

  existsAtVersion(type: Type, moment: TimelineMoment) {
    const availability = getAvailabilityMapInTimeline(this.#program, type, this.#timeline);
    if (!availability) return true;
    const isAvail = availability.get(moment)!;
    return isAvail === Availability.Added || isAvail === Availability.Available;
  }

  getNameAtVersion<T extends NameableType>(type: T, moment: TimelineMoment): T["name"] {
    const allValues = getRenamedFrom(this.#program, type);

    if (!allValues) return type.name;

    for (const val of allValues) {
      if (this.#timeline.isBefore(moment, val.version)) {
        return val.oldName;
      }
    }
    return type.name;
  }

  getTypeAtVersion(type: ModelProperty, moment: TimelineMoment): Type {
    const map = getTypeChangedFrom(this.#program, type);
    if (!map) return type.type;

    for (const [changedAtVersion, val] of map) {
      if (this.#timeline.isBefore(moment, changedAtVersion)) {
        return val;
      }
    }
    return type.type;
  }

  getReturnTypeAtVersion(type: Operation, moment: TimelineMoment): Type {
    const map = getReturnTypeChangedFrom(this.#program, type);
    if (!map) return type.returnType;

    for (const [changedAtVersion, val] of map) {
      if (this.#timeline.isBefore(moment, changedAtVersion)) {
        return val;
      }
    }
    return type.returnType;
  }
  getOptionalAtVersion(type: ModelProperty, moment: TimelineMoment): boolean {
    const optionalAt = getMadeOptionalOn(this.#program, type);
    const requiredAt = getMadeRequiredOn(this.#program, type);
    if (!optionalAt && !requiredAt) return type.optional;

    if (optionalAt) {
      if (this.#timeline.isBefore(moment, optionalAt)) {
        return false;
      } else {
        return true;
      }
    }
    if (requiredAt) {
      if (this.#timeline.isBefore(moment, requiredAt)) {
        return true;
      } else {
        return false;
      }
    }
    return type.optional;
  }
}

type NameableType = Type & { name?: string | symbol };
