---
id: functions
title: Functions
---

Functions in TypeSpec allow developers to compute and return types or values based on their inputs. Compared to [decorators](./decorators.md), functions provide an input-output based approach to creating type or value instances, offering more flexibility than decorators for creating new types dynamically. Functions enable complex type manipulation, filtering, and transformation.

Functions are declared using the `fn` keyword (with the required `extern` modifier, like decorators) and are backed by JavaScript implementations. When a TypeSpec program calls a function, the corresponding JavaScript function is invoked with the provided arguments, and the result is returned as either a Type or a Value depending on the function's declaration.

## Declaring functions

Functions are declared using the `extern fn` syntax followed by a name, parameter list, optional return type constraint, and semicolon:

```typespec
extern fn functionName(param1: Type, param2: valueof string): ReturnType;
```

Here are some examples of function declarations:

```typespec
// No arguments, returns a type (default return constraint is 'unknown')
extern fn createDefaultModel();

// Takes a string type, returns a type
extern fn transformModel(input: string);

// Takes a string value, returns a type
extern fn createFromValue(name: valueof string);

// Returns a value instead of a type
extern fn getDefaultName(): valueof string;

// Takes and returns values
extern fn processFilter(filter: valueof Filter): valueof Filter;
```

## Calling functions

Functions are called using standard function call syntax with parentheses. They can be used in type expressions, aliases, and anywhere a type or value is expected:

```typespec
// Call a function in an alias
alias ProcessedModel = transformModel("input");

// Call a function for a default value
model Example {
  name: string = getDefaultName();
}

// Use in template constraints
alias Filtered<T, F extends valueof Filter> = applyFilter(T, F);
```

## Return types and constraints

Functions can return either types or values, controlled by the return type constraint:

- **No return type specified**: Returns a `Type` (implicitly constrained to `unknown`)
- **`valueof SomeType`**: Returns a value of the specified type
- **Mixed constraints**: `Type | valueof Type` allows returning either types or values

```typespec
// Returns a type
extern fn makeModel(): Model;

// Returns a string value
extern fn getName(): valueof string;

// Can return either a type or value
extern fn flexible(): unknown | (valueof unknown);
```

## Parameter types

Function parameters follow the same rules as decorator parameters:

- **Type parameters**: Accept TypeScript types (e.g., `param: string`)
- **Value parameters**: Accept runtime values using `valueof` (e.g., `param: valueof string`)
- **Mixed parameters**: Can accept both types and values with union syntax

```typespec
extern fn process(
  model: Model,                   // Type parameter
  name: valueof string,           // Value parameter
  optional?: string,              // Optional type parameter
  ...rest: valueof string[]       // Rest parameter with values
);
```

## Practical examples

### Type transformation

```typespec
// Transform a model based on a filter
extern fn applyVisibility(input: Model, visibility: valueof VisibilityFilter): Model;

const PUBLIC_FILTER: VisibilityFilter = #{ any: #[Public] };

// Using a template to call a function can be beneficial because templates cache
// their instances. A function _never_ caches its results, so each time `applyVisibility`
// is called, it will run the underlying JavaScript function. By using a template to call
// the function, it ensures that the function is only called once per unique instance
// of the template.
alias PublicModel<M extends Model> = applyVisibility(UserModel, PUBLIC_FILTER);
```

### Value computation

```typespec
// Compute a default value
extern fn computeDefault(fieldType: string): valueof unknown;

model Config {
  timeout: int32 = computeDefault("timeout");
}
```

## Implementation notes

- Function results are _never_ cached, unlike template instances. Calling the same function with the same arguments
  multiple times will result in multiple function calls.
- Functions _may_ have side-effects when called; they are not guaranteed to be "pure" functions. Be careful when writing
  functions to avoid manipulating the type graph or storing undesirable state (though there is no rule that will prevent
  you from doing so).
