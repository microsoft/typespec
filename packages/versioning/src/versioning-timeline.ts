import { compilerAssert, getTypeName, type Namespace, type Program } from "@typespec/compiler";
import type { Version } from "./types.js";
import { getVersions } from "./versioning.js";

/**
 * Orders root-version resolutions together with otherwise unused dependency versions.
 * A dependency version used by several root versions appears in several moments;
 * version lookup selects its first occurrence. Use the shared version and moment
 * objects for lookups rather than constructing equivalent objects.
 *
 * @example
 * Given the following namespaces with their versions
 * ```
 * Library:
 *  l1
 *  l2
 *  l3
 *  l4
 *
 * Service:
 *  v1  -> (using) l1
 *  v2  -> (using) l3
 *  v3  -> (using) l3
 * ```
 *
 * This would be the data passed to the constructor
 * ```ts
 * new VersioningTimeline(program, [
 *   new Map([[serviceNs, v1], [libraryNs, l1]]),
 *   new Map([[serviceNs, v2], [libraryNs, l3]]),
 *   new Map([[serviceNs, v3], [libraryNs, l3]]),
 * ])
 * ```
 *
 * The following timeline is going to be represented
 *
 * | Service | Library |
 * |---------|---------|
 * |   v1    |   l1    |
 * |         |   l2    |
 * |   v2    |   l3    |
 * |   v3    |   l3    |
 * |         |   l4    |
 */
export class VersioningTimeline {
  #namespaces: Namespace[];
  #timeline: TimelineMoment[];
  #momentIndex: Map<TimelineMoment, number>;
  #versionIndex: Map<Version, number>;

  /**
   * Builds moments in resolution order, inserting unused versions before the
   * next selected version of the same namespace, or at the end.
   * Resolution maps are retained by the moments; do not modify them afterward.
   */
  constructor(program: Program, resolutions: Map<Namespace, Version>[]) {
    const indexedVersions = new Set<Version>();
    const namespaces = new Set<Namespace>();
    const timeline = (this.#timeline = resolutions.map((x) => new TimelineMoment(x)));
    for (const resolution of resolutions) {
      for (const [namespace, version] of resolution.entries()) {
        indexedVersions.add(version);
        namespaces.add(namespace);
      }
    }
    this.#namespaces = [...namespaces];

    function findIndexToInsert(version: Version): number {
      for (const [index, moment] of timeline.entries()) {
        const versionAtMoment = moment.getVersion(version.namespace);
        if (versionAtMoment && version.index < versionAtMoment.index) {
          return index;
        }
      }
      return -1;
    }

    for (const namespace of namespaces) {
      const [, versions] = getVersions(program, namespace);
      if (versions === undefined) {
        continue;
      }

      for (const version of versions.getVersions()) {
        if (!indexedVersions.has(version)) {
          indexedVersions.add(version);
          const index = findIndexToInsert(version);
          const newMoment = new TimelineMoment(new Map([[version.namespace, version]]));
          if (index === -1) {
            timeline.push(newMoment);
          } else {
            timeline.splice(index, 0, newMoment);
          }
        }
      }
    }

    this.#versionIndex = new Map();
    this.#momentIndex = new Map();
    for (const [index, moment] of timeline.entries()) {
      this.#momentIndex.set(moment, index);

      for (const version of moment.versions()) {
        if (!this.#versionIndex.has(version)) {
          this.#versionIndex.set(version, index);
        }
      }
    }
  }

  /** Formats the timeline as a table of version names, leaving absent namespace selections blank. */
  prettySerialize() {
    const hSep = "-".repeat(this.#namespaces.length * 13 + 1);
    const content = this.#timeline
      .map((moment) => {
        return (
          "| " +
          this.#namespaces
            .map((x) => (moment.getVersion(x)?.name ?? "").padEnd(10, " "))
            .join(" | ") +
          " |"
        );
      })
      .join(`\n${hSep}\n`);
    return ["", hSep, content, hSep].join("\n");
  }

  /** Gets the first moment containing the version, asserting if it is not part of this timeline. */
  get(version: Version): TimelineMoment {
    const index = this.getIndex(version);
    if (index === -1) {
      if (version instanceof TimelineMoment) {
        compilerAssert(false, `Timeline moment "${version?.name}" should have been resolved`);
      } else {
        compilerAssert(
          false,
          `Version "${version?.name}" from ${getTypeName(
            version.namespace,
          )} should have been resolved. ${this.prettySerialize()}`,
        );
      }
    }
    return this.#timeline[index];
  }

  /**
   * Gets the zero-based index of a moment or the first occurrence of a version.
   * Returns `-1` when the supplied object is not part of this timeline.
   */
  getIndex(version: Version | TimelineMoment): number {
    const index =
      version instanceof TimelineMoment
        ? this.#momentIndex.get(version)
        : this.#versionIndex.get(version);
    if (index === undefined) {
      return -1;
    }
    return index;
  }

  /**
   * Compares timeline positions, using the first occurrence for a version.
   * Both arguments should belong to this timeline; an unknown object has index `-1`.
   */
  isBefore(isBefore: Version | TimelineMoment, base: Version | TimelineMoment): boolean {
    const isBeforeIndex = this.getIndex(isBefore);
    const baseIndex = this.getIndex(base);
    return isBeforeIndex < baseIndex;
  }

  /** Gets the earliest moment, or `undefined` at runtime if the timeline is empty. */
  first(): TimelineMoment {
    return this.#timeline[0];
  }

  /** Iterates shared moment objects in timeline order. */
  [Symbol.iterator](): IterableIterator<TimelineMoment> {
    return this.#timeline[Symbol.iterator]();
  }
  /** Iterates zero-based positions and shared moment objects in timeline order. */
  entries(): IterableIterator<[number, TimelineMoment]> {
    return this.#timeline.entries();
  }
}

/**
 * Namespace version selections at one position in a {@link VersioningTimeline}.
 * A moment need not contain a version for every namespace in the timeline.
 */
export class TimelineMoment {
  /** Name of the first version in the supplied map, or an empty string for an empty map. */
  readonly name: string;
  #versionMap: Map<Namespace, Version>;

  /** Retains the supplied map by reference; callers should not modify it after construction. */
  public constructor(versionMap: Map<Namespace, Version>) {
    this.#versionMap = versionMap;
    this.name = versionMap.values().next().value?.name ?? "";
  }

  /** Gets this moment's selection for a namespace, or `undefined` when it has none. */
  getVersion(namespace: Namespace): Version | undefined {
    return this.#versionMap.get(namespace);
  }

  /** Iterates shared version objects in the supplied map's insertion order. */
  versions(): IterableIterator<Version> {
    return this.#versionMap.values();
  }
}
