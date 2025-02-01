import type {
  ModelProperty,
  Namespace,
  Operation,
  Program,
  RekeyableMap,
  Type,
} from "@typespec/compiler";
import type { unsafe_MutatorWithNamespace as MutatorWithNamespace } from "@typespec/compiler/experimental";
import { getMadeOptionalOn, getRenamedFrom, getReturnTypeChangedFrom } from "./decorators.js";
import type { Version } from "./types.js";
import { VersioningTimeline, type TimelineMoment } from "./versioning-timeline.js";
import { Availability, getAvailabilityMapInTimeline, resolveVersions } from "./versioning.js";

export interface VersionSnapshot {
  readonly version?: Version;
  readonly mutator: MutatorWithNamespace;
}
export function getVersionsMutators(program: Program, namespace: Namespace): VersionSnapshot[] {
  const versions = resolveVersions(program, namespace);
  const timeline = new VersioningTimeline(
    program,
    versions.map((x) => x.versions),
  );
  const helper = new VersioningHelper(program, timeline);
  return versions
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
}

export function createVersionMutator(
  versioning: VersioningHelper,
  moment: TimelineMoment,
): MutatorWithNamespace {
  function deleteAndRename<T extends Map<string | symbol, NameableType>>(
    map: T,
    rename: (oldName: string | symbol, newName: string | symbol, type: NameableType) => void,
  ) {
    for (const [name, type] of map) {
      if (!versioning.existsAtVersion(type, moment)) {
        map.delete(name);
      }
      // if (type.name !== undefined) {
      //   const nameAtVersion = versioning.getNameAtVersion(type, moment);
      //   if (nameAtVersion !== undefined && nameAtVersion !== type.name) {
      //     rename(type.name, nameAtVersion, type);
      //     type.name = nameAtVersion;
      //   }
      // }
    }
  }

  function deleteAndRenameUnordered(map: Map<string | symbol, NameableType>) {
    return deleteAndRename(map, (oldName, newName, type: NameableType) => {
      map.delete(oldName);
      map.set(newName, type);
    });
  }

  function deleteAndRenameOrdered(map: RekeyableMap<string | symbol, NameableType>) {
    return deleteAndRename(map, (oldName, newName) => {
      map.rekey(oldName, newName);
    });
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
    name: "VersionSnapshot",
    Namespace: (original, clone, p, realm) => {
      deleteAndRenameUnordered(clone.models);
      deleteAndRenameUnordered(clone.operations);
      deleteAndRenameUnordered(clone.interfaces);
      deleteAndRenameUnordered(clone.enums);
      deleteAndRenameUnordered(clone.unions);
      deleteAndRenameUnordered(clone.namespaces);
    },
    Interface: (original, clone, p, realm) => {
      deleteAndRenameOrdered(clone.operations);
    },
    Model: (original, clone, p, realm) => {
      rename(original, clone);
      deleteAndRenameOrdered(clone.properties);
    },
    Union: (original, clone, p, realm) => {
      rename(original, clone);
      deleteAndRenameOrdered(clone.variants);
    },
    UnionVariant: (original, clone, p, realm) => {
      rename(original, clone);
    },
    Enum: (original, clone, p, realm) => {
      rename(original, clone);
      deleteAndRenameOrdered(clone.members);
    },
    EnumMember: (original, clone, p, realm) => {
      rename(original, clone);
    },
    Operation: (original, clone, p, realm) => {
      rename(original, clone);
      const returnTypeAtVersion = versioning.getReturnTypeAtVersion(clone, moment);
      if (returnTypeAtVersion !== clone.returnType) {
        clone.returnType = returnTypeAtVersion;
      }
    },
    ModelProperty: (original, clone, p, realm) => {
      rename(original, clone);
      clone.optional = versioning.getOptionalAtVersion(original, moment);
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
  getReturnTypeAtVersion(type: Operation, moment: TimelineMoment): Type {
    const map = getReturnTypeChangedFrom(this.#program, type);
    if (!map) return type.returnType;

    for (const [changedAtVersion, val] of map) {
      if (this.#timeline.isBefore(moment, changedAtVersion)) {
        return val;
      }
    }
    return type;
  }
  getOptionalAtVersion(type: ModelProperty, moment: TimelineMoment): boolean {
    const version = getMadeOptionalOn(this.#program, type);
    if (!version) return type.optional;

    if (this.#timeline.isBefore(moment, version)) {
      return false;
    } else {
      return true;
    }
  }
}

type NameableType = Type & { name?: string | symbol };
