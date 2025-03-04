---
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Removed deprecated legacy visibility APIs and converted all warnings for using string-based visibility modifiers to errors.

The removed APIs include:

- `getVisibility`: use `getVisibilityForClass` instead.
- `getParameterVisibility`: use `getParameterVisibilityFilter` instead.
- `getReturnTypeVisibility`: use `getReturnTypeVisibilityFilter` instead.

Furthermore, the legacy signature of `isVisible` that accepts an array of strings has been removed. Please use the new signature that accepts `EnumMember` instead.

The changed decorators include:

- `@visibility`
- `@parameterVisibility`
- `@returnTypeVisibility`
- `@withVisibility`
- `@withDefaultKeyVisibility`

The `TypeSpec.DefaultKeyVisibility` template also no longer accepts a string as a visibility modifier argument.

Attempting to pass a string to any of the above decorators or templates will now result in a type-checking error. Please use the `Lifecycle` visibility modifiers instead.

If you develop a third-party library and you use any custom visibility modifiers, you will need to instead define a visibility class enum. See: [Visibility | TypeSpec](https://typespec.io/docs/language-basics/visibility/).
