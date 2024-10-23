---
jsApi: true
title: "[I] HttpOperation"

---
## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| `authentication?` | `public` | [`Authentication`](Authentication.md) | Operation authentication. Overrides HttpService authentication |
| `container` | `public` | [`OperationContainer`](../type-aliases/OperationContainer.md) | Parent type being the interface, namespace or global namespace. |
| `operation` | `public` | `Operation` | Operation type reference. |
| `overloading?` | `public` | [`HttpOperation`](HttpOperation.md) | Overload this operation |
| `overloads?` | `public` | [`HttpOperation`](HttpOperation.md)[] | List of operations that overloads this one. |
| `parameters` | `public` | [`HttpOperationParameters`](HttpOperationParameters.md) | Parameters. |
| `path` | `public` | `string` | Route path. Not recommended use [uriTemplate](HttpOperation.md) instead. This will not work for complex cases like not-escaping reserved chars. |
| ~~`pathSegments`~~ | `public` | `string`[] | Path segments **Deprecated** use [uriTemplate](HttpOperation.md) instead |
| `responses` | `public` | [`HttpOperationResponse`](HttpOperationResponse.md)[] | Responses. |
| `uriTemplate` | `readonly` | `string` | The fully resolved uri template as defined by http://tools.ietf.org/html/rfc6570. **Examples** `"/foo/{bar}/baz{?qux}"` `"/foo/{+path}"` |
| `verb` | `public` | [`HttpVerb`](../type-aliases/HttpVerb.md) | Route verb. |
