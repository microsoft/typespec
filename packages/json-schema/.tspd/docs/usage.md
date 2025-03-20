Add the `@jsonSchema` decorator to any types or namespaces you want to emit as JSON Schema.

```TypeSpec
import "@typespec/json-schema";

using JsonSchema;

@jsonSchema
namespace Example;

model Car {
  make: string;
  modelName: string;
}
```
