---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

## TypeSpec.HttpClient.CSharp

### `@dynamicModel` {#@TypeSpec.HttpClient.CSharp.dynamicModel}

Marks a model or namespace as dynamic, indicating it should generate dynamic model code.
Can be applied to Model or Namespace types.

```typespec
@TypeSpec.HttpClient.CSharp.dynamicModel
```

#### Target

`Model | Namespace`

#### Parameters

None

#### Examples

```tsp
@dynamicModel
model Pet {
  name: string;
  kind: string;
}

@dynamicModel
namespace PetStore {
  model Dog extends Pet {
    breed: string;
  }
}
```
