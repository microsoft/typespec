---
jsApi: true
title: "[I] DiagnosticCollector"

---
Helper object to collect diagnostics from function following the diagnostics accessor pattern(foo() => [T, Diagnostic[]])

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| `diagnostics` | `readonly` | readonly [`Diagnostic`](Diagnostic.md)[] |

## Methods

### add()

```ts
add(diagnostic): void
```

Add a diagnostic to the collection

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `diagnostic` | [`Diagnostic`](Diagnostic.md) | Diagnostic to add. |

#### Returns

`void`

***

### pipe()

```ts
pipe<T>(result): T
```

Unwrap the Diagnostic result, add all the diagnostics and return the data.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`DiagnosticResult`](../type-aliases/DiagnosticResult.md)<`T`\> | Accessor diagnostic result |

#### Returns

`T`

***

### wrap()

```ts
wrap<T>(value): DiagnosticResult<T>
```

Wrap the given value in a tuple including the diagnostics following the TypeSpec accessor pattern.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `T` | Accessor value to return |

#### Returns

[`DiagnosticResult`](../type-aliases/DiagnosticResult.md)<`T`\>

#### Example

```ts
return diagnostics.wrap(routes);
```
