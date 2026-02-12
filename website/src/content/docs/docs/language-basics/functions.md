---
id: functions
title: Functions
---

:::warning
Functions are an experimental TypeSpec feature. The API and behavior of functions may reasonably be expected to change in
future releases as we gather feedback. If you choose to use functions in your TypeSpec libraries and programs, please be
aware that you may need to make adjustments to your code when updating to new versions of TypeSpec. Declaring a function
will yield a warning (you may suppress the warning with `#suppress "experimental-feature"`).
:::

Functions in TypeSpec allow library developers to compute and return types or values based on their inputs. Compared to
[decorators](./decorators.md), functions provide an input-output based approach to creating type or value instances,
offering more flexibility than decorators for creating new types dynamically. Functions enable complex type
manipulation, filtering, and transformation.

Functions are declared using the `fn` keyword (with the required `extern` modifier, like decorators) and are backed by
JavaScript implementations. When a TypeSpec program calls a function, the corresponding JavaScript function is invoked
with the provided arguments, and the result is returned as either a Type or a Value depending on the function's
declaration.

## Declaring functions

Functions are declared using the `extern fn` syntax followed by a name, parameter list, optional return type constraint,
and semicolon:

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

Functions are called using standard function call syntax with parentheses. They can be used in type expressions, aliases,
and anywhere a type or value is expected:

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

:::note
A function call does not always evaluate to its return type. The function call may evaluate to any _subtype_
of the return type constraint (any type or value that is _assignable_ to the constraint). For example, a function that
returns `Reflection.Model` may actually evaluate to any model. A function that returns `Foo` where `Foo` is a model may
evaluate to any model that is assignable to `Foo`.
:::

## Parameter types

Function parameters follow the same rules as decorator parameters:

- **Type parameters**: Accept TypeScript types (e.g., `param: string`)
- **Value parameters**: Accept values using `valueof` (e.g., `param: valueof string`)
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

Functions may be used to transform types in arbitrary ways _without_ modifying an existing type instance. In the
following example, we declare a function `applyVisibility` that could be used to transform an input Model into an
output Model based on a `VisibilityFilter` object. We use a template alias to instantiate the new instance, because
templates _cache_ their instances and always return the same type for the same template arguments.

```typespec
// Transform a model based on a filter
extern fn applyVisibility(input: Model, visibility: valueof VisibilityFilter): Model;

const READ_FILTER: VisibilityFilter = #{ any: #[Public] };

// Using a template to call a function can be beneficial because templates cache
// their instances. A function _never_ caches its results, so each time `applyVisibility`
// is called, it will run the underlying JavaScript function. By using a template to call
// the function, it ensures that the function is only called once per unique instance
// of the template.
alias Read<M extends Model> = applyVisibility(M, READ_FILTER);
```

### Value computation

Functions can also be used to extract complex logic. The following example shows how a function might be used to compute
a default value for a given type of field. The external function can have arbitrarily complex JavaScript logic, so it
can utilize any method of computing the result value that it deems appropriate.

```typespec
// Compute a default value using some external logic
extern fn computeDefault(fieldType: string): valueof unknown;

model Config {
  timeout: int32 = computeDefault("timeout");
}
```

### Accepting options objects

You may find it useful to accept an "options" object as a parameter to a function. In such cases, it's a good idea to
define a model for the options structure, to provide better type safety and documentation for the expected options. You
can then use `valueof` to accept an instance of the options model as an argument to the function call.

```typespec
/** Options for the `createDerivedModel` function. */
model CreateDerivedModelOptions {
  /**
   * If set, overrides the name of the derived model.
   */
  name?: string;
}

/**
 * Creates a new model derived from the input model, with some optional modifications.
 *
 * @param m the input model to derive from
 * @param options optional parameters to control how the model is derived
 * @returns a new model derived from `m` with the specified options applied
 */
extern fn createDerivedModel(
  m: Reflection.Model,
  options?: valueof CreateDerivedModelOptions
): Reflection.Model;

// Example usage:
model BaseModel {
  id: int32;
}

alias DefaultDerived = createDerivedModel(BaseModel);
alias CustomDerived = createDerivedModel(BaseModel, #{ name: "CustomName" });
```

## Function _types_

A function itself is a _value_, and can be assigned to a constant:

```tsp
extern fn example(): void;

// A function is a value.
const f = example;
```

A function cannot be assigned to an _alias_ (though the _result of calling a function_ can, if the function evaluates to a type):

```tsp
extern fn example(): unknown;

// OK -- the function is a value
const f = example;

// Error
alias F = example;
//        ~~~~~~~ > A value cannot be used as a type.

// OK -- the result of calling `example` is a type.
alias T = example();
```

As values, functions have types:

```tsp
extern fn example(v: valueof string): valueof string;

// `Example` is equivalent to `fn (v: valueof string) => valueof string`
alias Example = typeof example;

const f: fn(v: valueof string) => valueof string = f;
```

### Function type syntax

A function type is written with the 'fn' keyword, followed by a parenthesized list of parameters, and an optional return type annotation. The parameters are like decorator parameters, and consist of a name, optional `?` indicating that the parameter is optional, and a type constraint (':' followed by a type constraint). The return type annotation uses the '=>' "double-arrow" sigil followed by a constraint type. Like with a function declaration, if the return type is not specified, it is implicitly `unknown`.

Here are some example function types:

- `fn()`: a function that requires no arguments and returns any type (`unknown`).
- `fn() => valueof unknown`: a function that requires no arguments and returns any _value_.
- `fn() => unknown | valueof unknown`: a function that requires no arguments and returns any entity (type or value).
- `fn(x: valueof string) => valueof string`: a function that requires one string value argument and returns a string value.
- `fn(x?: valueof string) => valueof int32`: a function that _optionally_ accepts one string value argument and returns an `int32` value.
- `fn(x: valueof string, ...rest: valueof string[]) => valueof boolean`: a function that requires at least one string value argument, accepts an arbitrary number of string value arguments, and returns a boolean value.
- `fn(m: Reflection.Model) => void`: a function that requires one argument that is a model type and returns `void`.

### Function type assignability

Functions may be assigned to any function type that is compatible with its call signature. In general, a function `A` is assignable to another function `B` if the arguments that can be passed to `B` are _guaranteed_ to be valid arguments for `A`, and the return type of `A` is a valid return type for `B`.

Compared to TypeScript function types, TypeSpec function types are a little bit stricter: a rest parameter cannot satisfy a required parameter (`fn (x: valueof string)` is not assignable to `fn (...args: valueof string[])`), but it can satisfy an _optional_ parameter (`fn (x?: valueof string)` is assignable to `fn(...args: valueof string[])`).

Here are some example functions and whether they are assignable to each other:

| Function A                               | Function B                               | Is A assignable to B? | Explanation                                                                                                                            |
| ---------------------------------------- | ---------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `fn () => valueof string`                | `fn () => valueof unknown`               | ✅ Yes                | `valueof string` is assignable to `valueof unknown`.                                                                                   |
| `fn () => valueof unknown`               | `fn () => valueof string`                | ❌ No                 | `valueof unknown` is not assignable to `valueof string`.                                                                               |
| `fn (x: valueof string) => void`         | `fn (x: valueof unknown) => void`        | ❌ No                 | `valueof unknown` is not assignable to `valueof string` (Function A _requires_ a string, but Function B may be called with any value). |
| `fn (x: valueof unknown) => void`        | `fn (x: valueof string) => void`         | ✅ Yes                | `valueof string` is assignable to `valueof unknown` (Function A may be called with any value, so it can also be called with a string). |
| `fn (x?: valueof string) => void`        | `fn (...args: valueof string[]) => void` | ✅ Yes                | Function A _optionally_ takes one string argument, and Function B can be called with any number of string arguments                    |
| `fn (...args: valueof string[]) => void` | `fn (x?: valueof string) => void`        | ✅ Yes                | Function A can be called with any number of string arguments, and Function B may be called with one string argument or none.           |
| `fn (x: valueof string) => void`         | `fn (...args: valueof string[]) => void` | ❌ No                 | Function A _requires_ one string argument, but Function B may be called with zero arguments.                                           |
| `fn (...args: valueof string[]) => void` | `fn (x: valueof string) => void`         | ✅ Yes                | Function A can be called with any number of string arguments, and Function B _requires_ one string argument.                           |

### When to use function types

Use a function type to constrain a value to be a function with a specific call signature. This may be useful for decorators that accept functions as arguments, or for defining template arguments that accept functions. Ordinarily, you will not need to use function types unless you are developing a library that makes use of higher-order functions (i.e., functions or decorators that accept other functions as arguments).

Examples:

```tsp
/**
 * Calls `f` with the given model.
 *
 * @param f An function that accepts the model.
 */
extern dec apply(target: Reflection.Model, f: valueof fn(m: Reflection.Model) => void);

/**
 * Maps over an array using the provided function.
 *
 * @param arr The array of values to map over.
 * @param f A function that maps each item in `arr` to a new value.
 * @returns an array of the results of calling `f` on each item in `arr`.
 */
extern fn map(arr: valueof unknown[], f: valueof fn(item: valueof unknown) => valueof unknown);

/**
 * A model that accepts a function to create a default value.
 *
 * Template parameters can be function values as well, in the same way that they can be string
 * or numeric values, and function typed parameters can have function values as defaults.
 */
model MyTemplate<
  Props extends Reflection.Model,
  MakeId extends valueof fn(props: Reflection.Model) => valueof string = makeIdDefault
> {
  id: string = MakeId(Props);
  ...Props;
}

/** A default function to create IDs for `MyTemplate`. */
extern fn makeIdDefault(props: Reflection.Model): valueof string;
```

Note the use of `valueof`. Without `valueof`, the parameter `f` would be a type parameter, and would only accept a compatible function _type_. By using `valueof`, the parameter `f` will accept a function _value_ (a callable function) that is compatible with the specified signature.

## Implementation notes

- Function results are _never_ cached, unlike template instances. Calling the same function with the same arguments
  multiple times will result in multiple function calls.
- Functions _may_ have side-effects when called; they are not guaranteed to be "pure" functions. Be careful when writing
  functions to avoid manipulating the type graph or storing undesirable state (though there is no rule that will prevent
  you from doing so).
- Functions are evaluated in the compiler. If you write or utilize computationally intense functions, it will impact
  compilation times and may affect language server performance.

## Implementing functions in your library

See [Extending TypeSpec - Functions](../extending-typespec/implement-functions.md) for more information about how to add
a function to your TypeSpec library.
