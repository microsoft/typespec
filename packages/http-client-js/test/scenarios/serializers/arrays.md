# **Handling Serialization and Deserialization of Primitive Array Properties**

This test verifies that a **primitive array property** (`int32[]`) is correctly handled in the generated TypeScript code. The expected output includes:

- A `Foo` model with a `myValues` property mapped to `Array<number>`.
- `jsonFooToTransportTransform` and `jsonFooToApplicationTransform` functions that internally use an `arraySerializer`.
- Transformation functions for `int32[]`, ensuring elements are properly processed.

### **Potential Optimization Consideration**

Since primitive types **do not require transformation**, generating explicit functions like `jsonArrayInt32ToTransportTransform` and `jsonArrayInt32ToApplicationTransform` might be **redundant**. Optimizing this could **eliminate unnecessary transformations**, reducing the amount of generated code while maintaining correctness.

## **TypeSpec**

```tsp
model Foo {
  my_values: int32[];
}
op foo(): Foo;
```

## **TypeScript**

### **Generated Model**

A TypeScript model representing `Foo` with `myValues` properly typed as `Array<number>`.

```ts src/models/models.ts interface Foo
export interface Foo {
  myValues: Array<number>;
}
```

### **Primitive Array Transformation (Consider Optimization)**

The generated transformation functions iterate over `int32[]` values, but since **no actual transformation occurs**, this code could be **optimized away**.

```ts src/models/internal/serializers.ts function jsonArrayInt32ToTransportTransform
export function jsonArrayInt32ToTransportTransform(items_?: Array<number> | null): any {
  if (!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = item as any;
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}
```

### **Serializer for `Foo`**

Uses `jsonArrayInt32ToTransportTransform` for `myValues`, though this could be optimized by **directly passing the array** instead of applying a redundant transformation function.

```ts src/models/internal/serializers.ts function jsonFooToTransportTransform
export function jsonFooToTransportTransform(input_?: Foo | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    my_values: jsonArrayInt32ToTransportTransform(input_.myValues),
  }!;
}
```

### **Operation Function for `Foo`**

Handles the API request, expecting a `Widget` response and applying the correct deserialization function.

```ts src/api/clientOperations.ts function foo
export async function foo(client: ClientContext, options?: FooOptions): Promise<Foo> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonFooToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
```

### **Primitive Array Deserialization (Consider Optimization)**

Again, the transformation logic is redundant for primitive types. Instead of generating a function, the deserializer could **use the array directly**.

```ts src/models/internal/serializers.ts function jsonArrayInt32ToApplicationTransform
export function jsonArrayInt32ToApplicationTransform(items_?: any): Array<number> {
  if (!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = item as any;
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}
```

### **Deserializer for `Foo`**

Uses the same unnecessary transformation for `myValues`. Optimizing the pipeline could **eliminate this step** for primitive arrays.

```ts src/models/internal/serializers.ts function jsonFooToApplicationTransform
export function jsonFooToApplicationTransform(input_?: any): Foo {
  if (!input_) {
    return input_ as any;
  }
  return {
    myValues: jsonArrayInt32ToApplicationTransform(input_.my_values),
  }!;
}
```

---

# **Handling Serialization and Deserialization of Complex Array Properties**

This test verifies that **arrays of complex types** (`Bar[]`) are correctly handled in the generated TypeScript code. Unlike primitive arrays, complex types **require transformation functions** to ensure serialization and deserialization are applied correctly.

## **TypeSpec**

```tsp
model Bar {
  bar_value: string;
}

model Foo {
  my_values: Bar[];
}
op foo(): Foo;
```

## **TypeScript**

### **Generated Models**

Defines TypeScript interfaces for `Foo` and `Bar`, ensuring `myValues` is properly typed as `Array<Bar>`.

```ts src/models/models.ts interface Foo
export interface Foo {
  myValues: Array<Bar>;
}
```

```ts src/models/models.ts interface Bar
export interface Bar {
  barValue: string;
}
```

### **Serializer for `Foo`**

Uses `jsonArrayBarToTransportTransform` to serialize each `Bar` instance inside `myValues`, ensuring proper transformation of complex objects.

```ts src/models/internal/serializers.ts function jsonFooToTransportTransform
export function jsonFooToTransportTransform(input_?: Foo | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    my_values: jsonArrayBarToTransportTransform(input_.myValues),
  }!;
}
```

### **Deserializer for `Foo`**

Similarly, the deserializer converts each `Bar` instance in `myValues` back into an application model using `jsonArrayBarToApplicationTransform`.

```ts src/models/internal/serializers.ts function jsonFooToApplicationTransform
export function jsonFooToApplicationTransform(input_?: any): Foo {
  if (!input_) {
    return input_ as any;
  }
  return {
    myValues: jsonArrayBarToApplicationTransform(input_.my_values),
  }!;
}
```
