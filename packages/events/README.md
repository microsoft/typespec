# @typespec/events

TypeSpec library providing events bindings

## Install

```bash
npm install @typespec/events
```

## Decorators

### TypeSpec.Events

- [`@contentType`](#@contenttype)
- [`@data`](#@data)
- [`@events`](#@events)

#### `@contentType`

```typespec
@TypeSpec.Events.contentType(contentType: string)
```

##### Target

`UnionVariant`

##### Parameters

| Name        | Type     | Description |
| ----------- | -------- | ----------- |
| contentType | `string` |             |

#### `@data`

```typespec
@TypeSpec.Events.data
```

##### Target

`ModelProperty`

##### Parameters

None

#### `@events`

```typespec
@TypeSpec.Events.events
```

##### Target

`Union`

##### Parameters

None
