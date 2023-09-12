---
jsApi: true
title: "[F] $doc"

---
```ts
$doc(
  context,
  target,
  text,
  sourceObject?): void
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](Interface.DecoratorContext.md) |
| `target` | [`Type`](Type.Type.md) |
| `text` | `string` |
| `sourceObject`? | [`Type`](Type.Type.md) |

## Returns

`void`

## Doc

attaches a documentation string. Works great with multi-line string literals.

The first argument to

## Doc

is a string, which may contain template parameters, enclosed in braces,
which are replaced with an attribute for the type (commonly "name") passed as the second (optional) argument.

## Doc

can be specified on any language element -- a model, an operation, a namespace, etc.
