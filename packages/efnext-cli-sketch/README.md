# @typespec/efnext-cli-sketch

emitter framework prototype

## Install

```bash
npm install @typespec/efnext-cli-sketch
```

## Decorators

### TypeSpecCLI

- [`@cli`](#@cli)
- [`@invertable`](#@invertable)
- [`@positional`](#@positional)
- [`@short`](#@short)

#### `@cli`

```typespec
@TypeSpecCLI.cli
```

##### Target

`Namespace | Interface | Operation`

##### Parameters

None

#### `@invertable`

```typespec
@TypeSpecCLI.invertable
```

##### Target

`ModelProperty`

##### Parameters

None

#### `@positional`

```typespec
@TypeSpecCLI.positional
```

##### Target

`ModelProperty`

##### Parameters

None

#### `@short`

```typespec
@TypeSpecCLI.short(value: valueof string)
```

##### Target

`ModelProperty`

##### Parameters

| Name  | Type             | Description |
| ----- | ---------------- | ----------- |
| value | `valueof string` |             |
