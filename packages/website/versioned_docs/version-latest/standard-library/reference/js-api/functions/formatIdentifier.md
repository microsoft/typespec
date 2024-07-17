---
jsApi: true
title: "[F] formatIdentifier"

---
```ts
function formatIdentifier(sv): string
```

Print a string as a TypeSpec identifier. If the string is a valid identifier, return it as is otherwise wrap it into backticks.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sv` | `string` | Identifier string value. |

## Returns

`string`

Identifier string as it would be represented in a TypeSpec file.

## Example

```ts
printIdentifier("foo") // foo
printIdentifier("foo bar") // `foo bar`
```
