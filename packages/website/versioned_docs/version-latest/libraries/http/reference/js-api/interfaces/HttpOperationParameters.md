---
jsApi: true
title: "[I] HttpOperationParameters"

---
## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| `body?` | `public` | [`HttpOperationBody`](HttpOperationBody.md) \| [`HttpOperationMultipartBody`](HttpOperationMultipartBody.md) | - |
| ~~`bodyParameter?`~~ | `public` | `ModelProperty` | **Deprecated** use body.parameter |
| ~~`bodyType?`~~ | `public` | `Type` | **Deprecated** use body.type |
| `parameters` | `public` | [`HttpOperationParameter`](../type-aliases/HttpOperationParameter.md)[] | - |
| `properties` | `readonly` | [`HttpProperty`](../type-aliases/HttpProperty.md)[] | Http properties |
