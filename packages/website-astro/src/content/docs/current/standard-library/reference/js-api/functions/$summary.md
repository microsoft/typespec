---
jsApi: true
title: "[F] $summary"

---
```ts
$summary(
   context, 
   target, 
   text, 
   sourceObject): void
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `context` | [`DecoratorContext`](../interfaces/DecoratorContext.md) |
| `target` | [`Type`](../type-aliases/Type.md) |
| `text` | `string` |
| `sourceObject` | [`Type`](../type-aliases/Type.md) |

## Returns

## Summary

attaches a documentation string. It is typically used to give a short, single-line
description, and can be used in combination with or instead of @doc.

The first argument to

## Summary

is a string, which may contain template parameters, enclosed in braces,
which are replaced with an attribute for the type (commonly "name") passed as the second (optional) argument.

## Summary

can be specified on any language element -- a model, an operation, a namespace, etc.
