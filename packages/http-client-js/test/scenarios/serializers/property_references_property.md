# Property References in Model Serialization

This test verifies that property references in TypeSpec models are correctly serialized, particularly in scenarios involving nullable property references. This was created to address a specific issue where property references combined with nullable types were causing incorrect serialization.

## Background

When a model property references another model's property (e.g., `TodoItemPatch.title` referencing `TodoItem.title`), the emitter needs to:

1. Correctly unpack the referenced property
2. Handle cases where the reference is combined with a nullable type
3. Generate appropriate serialization code

### Key Concepts

- Property References: Using dot notation to reference properties from other models (e.g., `TodoItem.title`)
- Nullable References: Combining property references with null union type (e.g., `TodoItem.assignedTo | null`)

## Spec

```tsp
namespace Test;
model TodoItem {
  id: safeint;
  title: string;
  assignedTo: string;
}

model TodoItemPatch {
  title?: TodoItem.title;
  assignedTo?: TodoItem.assignedTo | null;
}
@patch op update(
  @header contentType: "application/merge-patch+json",
  @path id: TodoItem.id,
  @body patch: TodoItemPatch,
): TodoItem;
```

## Serializer

Validates that the serializer generates the correct serialization logic for:

- Direct property references (`title?: TodoItem.title`)
- Nullable property references (`assignedTo?: TodoItem.assignedTo | null`)

```ts src/models/internal/serializers.ts function jsonTodoItemPatchToTransportTransform
export function jsonTodoItemPatchToTransportTransform(input_?: TodoItemPatch | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    title: input_.title,
    assignedTo: input_.assignedTo,
  }!;
}
```

## Deserializer

Validates the deserialization logic maintains type consistency when converting from transport to application models.

```ts src/models/internal/serializers.ts function jsonTodoItemPatchToApplicationTransform
export function jsonTodoItemPatchToApplicationTransform(input_?: any): TodoItemPatch {
  if (!input_) {
    return input_ as any;
  }
  return {
    title: input_.title,
    assignedTo: input_.assignedTo,
  }!;
}
```
