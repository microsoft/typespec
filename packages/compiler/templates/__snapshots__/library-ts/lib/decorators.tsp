import "../dist/src/decorators.js";

using TypeSpec.Reflection;

/**
 * Provide an alternate name for an operation.
 * @param name The alternate name.
 */
extern dec alternateName(target: Operation, name: valueof string);
