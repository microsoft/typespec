import "../../dist/src/lib/tsp-index.js";

using TypeSpec.Reflection;

namespace TypeSpec.Scopes;

/**
 * Declares a scope hierarchy edge: selecting `target` also satisfies conditions on `parent`.
 * A member can have several parents, possibly from another enum, as long as they share the
 * same root axis. Members with children are abstract and are not checked as views themselves.
 */
extern dec parent(target: EnumMember, parent: EnumMember);

/** Replace the property type in the scope views where this application is active. */
auto dec type(target: ModelProperty, type: unknown);

/** Replace the property optionality in the scope views where this application is active. */
auto dec optional(target: ModelProperty, optional: valueof boolean);

/** Rename the property in the scope views where this application is active. */
auto dec name(target: ModelProperty, name: valueof string);

/** Replace the operation return type in the scope views where this application is active. */
auto dec returnType(target: Operation, type: unknown);

/**
 * Take the operation signature from `operation`, like `op x is operation`, in the scope views
 * where this application is active. The operation-level decorators of `operation` are applied
 * first, as with `is`.
 */
auto dec signature(target: Operation, operation: Operation);
