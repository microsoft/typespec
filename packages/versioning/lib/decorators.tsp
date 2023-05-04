import "../dist/src/versioning.js";

using TypeSpec.Reflection;

namespace TypeSpec {
  namespace Versioning {
    /**
     * Identifies that the decorated namespace is versioned by the provided enum.
     * @param versions The enum that describes the supported versions.
     */
    extern dec versioned(target: Namespace, versions: Enum);

    /**
     * Identifies that a namespace or a given versioning enum member relies upon a versioned package.
     * @param versionRecords The dependent library version(s) for the target namespace or version.
     */
    extern dec useDependency(target: EnumMember | Namespace, ...versionRecords: EnumMember[]);

    /**
     * Identifies when the target was added.
     * @param version The version that the target was added in.
     */
    extern dec added(target: unknown, version: EnumMember);

    /**
     * Identifies when the target was removed.
     * @param version The version that the target was removed in.
     */
    extern dec removed(target: unknown, version: EnumMember);

    /**
     * Identifies when the target has been renamed.
     * @param version The version that the target was renamed in.
     * @param oldName The previous name of the target.
     */
    extern dec renamedFrom(target: unknown, version: EnumMember, oldName: string);

    /**
     * Identifies when a target was made optional.
     * @param version The version that the target was made optional in.
     */
    extern dec madeOptional(target: unknown, version: EnumMember);

    /**
     * Identifies when the target type changed.
     * @param version The version that the target type changed in.
     * @param oldType The previous type of the target.
     */
    extern dec typeChangedFrom(target: unknown, version: EnumMember, oldType: unknown);

    /**
     * Returns whether the target exists for the given version.
     * @param version The version to check.
     */
    extern fn existsAtVersion(target: unknown, version: EnumMember): boolean;

    /**
     * Returns whether the target has a different name for the given version.
     * @param version The version to check.
     */
    extern fn hasDifferentNameAtVersion(target: unknown, version: EnumMember): boolean;

    /**
     * Returns whether the target was made optional after the given version.
     * @param version The version to check.
     */
    extern fn madeOptionalAfter(target: unknown, version: EnumMember): boolean;

    /**
     * Returns whether the version exists for the provided enum member.
     * @param version The version to check.
     */
    extern fn getVersionForEnumMember(target: unknown, version: EnumMember): boolean;
  }
}
