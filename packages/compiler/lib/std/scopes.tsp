import "../../dist/src/lib/tsp-index.js";

using TypeSpec.Reflection;

namespace TypeSpec.Scopes;

/**
 * Declares a scope hierarchy edge. Child scopes inherit metadata from their parent.
 * The parent must belong to the same enum. Experimental conditional-scope POC.
 */
extern dec parent(target: EnumMember, parent: EnumMember);

/**
 * Experimental view-only property type override. The base graph is unchanged.
 * This POC annotation exercises structural facets without committing to variant syntax.
 */
auto dec type(target: ModelProperty, type: unknown);

/** Experimental view-only optionality override. */
auto dec optional(target: ModelProperty, optional: valueof boolean);

/** Experimental view-only name override. */
auto dec name(target: unknown, name: valueof string);

/** Experimental view-only operation return type override. */
auto dec returnType(target: Operation, type: unknown);
