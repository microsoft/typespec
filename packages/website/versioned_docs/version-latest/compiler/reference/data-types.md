---
title: "Data types"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Data types

## TypeSpec

### `object` {#object}

Represent any structured model.(With properties)

```typespec
model TypeSpec.object
```

### `Array` {#Array}

Array model type, equivalent to `T[]`

```typespec
model Array<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `Record` {#Record}

Model with string properties where all the properties have type `T`

```typespec
model Record<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `OptionalProperties` {#OptionalProperties}

```typespec
model OptionalProperties<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `UpdateableProperties` {#UpdateableProperties}

```typespec
model UpdateableProperties<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `OmitProperties` {#OmitProperties}

```typespec
model OmitProperties<T, TKeys>
```

#### Template Parameters

| Name  | Description |
| ----- | ----------- |
| T     |             |
| TKeys |             |

### `OmitDefaults` {#OmitDefaults}

```typespec
model OmitDefaults<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `DefaultKeyVisibility` {#DefaultKeyVisibility}

```typespec
model DefaultKeyVisibility<T, Visibility>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| T          |             |
| Visibility |             |

### `ServiceOptions` {#ServiceOptions}

Service options.

```typespec
model TypeSpec.ServiceOptions
```
