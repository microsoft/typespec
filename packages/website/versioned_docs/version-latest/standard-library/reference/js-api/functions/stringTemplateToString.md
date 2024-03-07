---
jsApi: true
title: "[F] stringTemplateToString"

---
```ts
stringTemplateToString(stringTemplate): [string, readonly Diagnostic[]]
```

Convert a string template to a string value.
Only literal interpolated can be converted to string.
Otherwise diagnostics will be reported.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `stringTemplate` | [`StringTemplate`](../interfaces/StringTemplate.md) | String template to convert. |

## Returns

[`string`, readonly [`Diagnostic`](../interfaces/Diagnostic.md)[]]
