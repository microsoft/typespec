# dynamicModel Decorator Usage Example

The `@dynamicModel` decorator can be applied to models and namespaces in TypeSpec to indicate that they should generate dynamic model code in the C# emitter.

## Usage

```typespec
import "@typespec/http-client-csharp";

using TypeSpec.Http.Client.CSharp;

// Mark a model as dynamic
@dynamicModel
model Pet {
  name: string;
  age: int32;
  kind: string;
}

// Mark a namespace as dynamic
@dynamicModel
namespace PetStore {
  model Dog extends Pet {
    breed: string;
  }
  
  model Cat extends Pet {
    isIndoor: boolean;
  }
}

// Regular operations that use the dynamic models
@service({
  title: "Pet Store Service"
})
namespace PetStoreService {
  @get op getPet(): Pet;
  @get op getDog(): PetStore.Dog;
  @get op getCat(): PetStore.Cat;
}
```

## Behavior

- When `@dynamicModel` is applied to a model, that specific model will be marked for dynamic code generation
- When `@dynamicModel` is applied to a namespace, all models within that namespace will be considered for dynamic code generation
- The decorator stores metadata that can be accessed during code generation using the `isDynamicModel` helper function

## Code Generation Integration

In the C# emitter, you can check if a model or namespace is marked as dynamic:

```typescript
import { isDynamicModel } from "@typespec/http-client-csharp";

// During code generation
if (isDynamicModel(program, model)) {
  // Generate dynamic model code
} else {
  // Generate regular model code
}
```