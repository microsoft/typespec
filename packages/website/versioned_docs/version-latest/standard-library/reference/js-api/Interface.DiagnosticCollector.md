---
jsApi: true
title: "[I] DiagnosticCollector"

---
Helper object to collect diagnostics from function following the diagnostics accessor pattern(foo() => [T, Diagnostic[]])

## Properties

| Property | Type |
| :------ | :------ |
| `readonly` `diagnostics` | *readonly* [`Diagnostic`](Interface.Diagnostic.md)[] |

## Methods

### add

```ts
add(diagnostic): void
```

Add a diagnostic to the collection

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `diagnostic` | [`Diagnostic`](Interface.Diagnostic.md) | Diagnostic to add. |

#### Returns

`void`

***

### pipe

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
| `result` | [`DiagnosticResult`](Type.DiagnosticResult.md)< `T` \> | Accessor diagnostic result |

#### Returns

`T`

***

### wrap

```ts
wrap<T>(value): DiagnosticResult< T >
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

[`DiagnosticResult`](Type.DiagnosticResult.md)< `T` \>

#### Example

```ts
return diagnostics.wrap(routes);
```
