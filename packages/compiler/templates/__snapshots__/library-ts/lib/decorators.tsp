import "../dist/src/decorators.js";

using TypeSpec.Reflection;

namespace LibraryTs;

/**
 * Provide an alternate name for an operation.
 * @param name The alternate name.
 */
extern dec alternateName(target: Operation, name: valueof string);
