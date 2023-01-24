---
title: "Data types"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Data types

## Cadl

### `object` {#object}

Represent any structured model.(With properties)

```cadl
model Cadl.object
```

### `Array` {#Array}

Array model type, equivalent to `T[]`

```cadl
model Array<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `Record` {#Record}

Model with string properties where all the properties have type `T`

```cadl
model Record<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `OptionalProperties` {#OptionalProperties}

```cadl
model OptionalProperties<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `UpdateableProperties` {#UpdateableProperties}

```cadl
model UpdateableProperties<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `OmitProperties` {#OmitProperties}

```cadl
model OmitProperties<T, TKeys>
```

#### Template Parameters

| Name  | Description |
| ----- | ----------- |
| T     |             |
| TKeys |             |

### `OmitDefaults` {#OmitDefaults}

```cadl
model OmitDefaults<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `DefaultKeyVisibility` {#DefaultKeyVisibility}

```cadl
model DefaultKeyVisibility<T, Visibility>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| T          |             |
| Visibility |             |

### `ServiceOptions` {#ServiceOptions}

Service options.

```cadl
model Cadl.ServiceOptions
```
