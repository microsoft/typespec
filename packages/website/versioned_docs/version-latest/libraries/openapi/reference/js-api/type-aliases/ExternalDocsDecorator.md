---
jsApi: true
title: "[T] ExternalDocsDecorator"

---
```ts
type ExternalDocsDecorator: (context, target, url, description?) => void;
```

Specify the OpenAPI `externalDocs` property for this type.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | `DecoratorContext` | - |
| `target` | `Type` | - |
| `url` | `string` | Url to the docs |
| `description`? | `string` | Description of the docs |

## Returns

`void`

## Example

```typespec
@externalDocs("https://example.com/detailed.md", "Detailed information on how to use this operation")
op listPets(): Pet[];
```
