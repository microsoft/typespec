import type { EnumMember, Namespace } from "@typespec/compiler";

/**
 * Metadata for a member of the enum registered by `@versioned`.
 * Instances are shared by metadata queries; treat them as read-only and preserve
 * their identity when using them as keys in version maps.
 */
export interface Version {
  /** Enum member name, independent of any explicit value assigned to the member. */
  name: string;
  /** Explicit enum member value converted to a string, or its name when no value is set. */
  value: string;
  /** Namespace that registered the version enum with `@versioned`. */
  namespace: Namespace;
  /** Source enum member represented by this version. */
  enumMember: EnumMember;
  /** Zero-based position in the version enum; determines ordering, not the member's value. */
  index: number;
}

/** A root namespace version together with the versions selected for its dependency graph. */
export interface VersionResolution {
  /**
   * Version for the root namespace. `undefined` if not versioned.
   */
  rootVersion: Version | undefined;

  /**
   * Selected versions for the root namespace, when versioned, and its transitive
   * versioned dependencies. This is a newly allocated map containing shared
   * {@link Version} objects; iteration order is not a dependency ordering.
   */
  versions: Map<Namespace, Version>;
}
