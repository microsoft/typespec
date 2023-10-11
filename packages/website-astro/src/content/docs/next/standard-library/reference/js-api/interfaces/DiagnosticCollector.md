---
jsApi: true
title: "[I] DiagnosticCollector"

---
Helper object to collect diagnostics from function following the diagnostics accessor pattern(foo() => [T, Diagnostic[]])

## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `readonly` | `diagnostics` | readonly [`Diagnostic`](Diagnostic.md)[] | - |

## Methods

### add()

```ts
add(diagnostic): void
```

Add a diagnostic to the collection

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `diagnostic` | [`Diagnostic`](Diagnostic.md) | Diagnostic to add. |

***

### pipe()

```ts
pipe<T>(result): T
```

Unwrap the Diagnostic result, add all the diagnostics and return the data.

#### Type parameters

| Parameter |
| :------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `result` | [`DiagnosticResult`](../type-aliases/DiagnosticResult.md)<`T`\> | Accessor diagnostic result |

***

### wrap()

```ts
wrap<T>(value): DiagnosticResult<T>
```

Wrap the given value in a tuple including the diagnostics following the TypeSpec accessor pattern.

#### Type parameters

| Parameter |
| :------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `value` | `T` | Accessor value to return |

#### Returns

#### Example

```ts
return diagnostics.wrap(routes);
```
