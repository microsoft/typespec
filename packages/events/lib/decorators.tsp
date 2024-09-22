import "../dist/src/decorators.js";

using TypeSpec.Reflection;

namespace TypeSpec.Events;

extern dec events(target: Union);

extern dec contentType(target: UnionVariant, contentType: string);

extern dec data(target: ModelProperty);
