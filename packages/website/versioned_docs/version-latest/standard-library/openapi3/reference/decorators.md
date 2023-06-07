---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## OpenAPI

### `@oneOf` {#@OpenAPI.oneOf}

Specify that `oneOf` should be used instead of `anyOf` for that union.

```typespec
@OpenAPI.oneOf
```

#### Target

`Union`

#### Parameters

None

### `@useRef` {#@OpenAPI.useRef}

Specify an external reference that should be used inside of emitting this type.

```typespec
@OpenAPI.useRef(ref: string)
```

#### Target

`union Model | ModelProperty`

#### Parameters

| Name | Type            | Description                                                          |
| ---- | --------------- | -------------------------------------------------------------------- |
| ref  | `scalar string` | External reference(e.g. "../../common.json#/components/schemas/Foo") |
