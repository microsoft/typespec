import "../dist/src/versioning.js";

using TypeSpec.Reflection;

namespace TypeSpec {
  namespace Versioning {
    /**
     * Identifies that the decorated namespace is versioned by the provided enum.
     */
    extern dec versioned(target: Namespace, versions: Enum);

    /**
     * Identifies that a namespace or a given versioning enum member relies upon a versioned package.
     */
    extern dec useDependency(target: EnumMember | Namespace, ...versionRecords: EnumMember[]);

    /**
     * Identifies a mapping of versions to versioned dependencies for a namespace.
     * @deprecated
     */
    extern dec versionedDependency(
      target: Namespace,
      mapping: EnumMember | [EnumMember, EnumMember][]
    );

    /**
     * Identifies when the target was added.
     */
    extern dec added(target: unknown, version: EnumMember);

    /**
     * Identifies when the target was removed.
     */
    extern dec removed(target: unknown, version: EnumMember);

    /**
     * Identifies when the target has been renamed.
     */
    extern dec renamedFrom(target: unknown, version: EnumMember, oldName: string);

    /**
     * Identifies when a target was made optional.
     */
    extern dec madeOptional(target: unknown, version: EnumMember);

    /**
     * Identies when the target type changed.
     */
    extern dec typeChangedFrom(target: unknown, version: EnumMember, oldType: unknown);

    /**
     * Returns whether the target exists for the given version.
     */
    extern fn existsAtVersion(target: unknown, version: EnumMember): boolean;

    /**
     * Returns whether the target has a different name for the given version.
     */
    extern fn hasDifferentNameAtVersion(target: unknown, version: EnumMember): boolean;

    /**
     * Returns whether the target was made optional after the given version.
     */
    extern fn madeOptionalAfter(target: unknown, version: EnumMember): boolean;

    /**
     * Returns whether the version exists for the provided enum member.
     */
    extern fn getVersionForEnumMember(target: unknown, version: EnumMember): boolean;
  }
}
