Add the `@jsonSchema` decorator to any types or namespaces you want to emit as JSON Schema.

```TypeSpec
import "@typespec/json-schema";

using TypeSpec.JsonSchema;

@jsonSchema
namespace Example;

model Car {
  make: string;
  model: string;
}
```
