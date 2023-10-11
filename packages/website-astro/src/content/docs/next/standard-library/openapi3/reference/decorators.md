---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## TypeSpec.OpenAPI

### `@oneOf` {#@TypeSpec.OpenAPI.oneOf}

Specify that `oneOf` should be used instead of `anyOf` for that union.

```typespec
@TypeSpec.OpenAPI.oneOf
```

#### Target

`union Union | ModelProperty`

#### Parameters

None

### `@useRef` {#@TypeSpec.OpenAPI.useRef}

Specify an external reference that should be used inside of emitting this type.

```typespec
@TypeSpec.OpenAPI.useRef(ref: valueof string)
```

#### Target

`union Model | ModelProperty`

#### Parameters

| Name | Type                    | Description                                                          |
| ---- | ----------------------- | -------------------------------------------------------------------- |
| ref  | `valueof scalar string` | External reference(e.g. "../../common.json#/components/schemas/Foo") |
