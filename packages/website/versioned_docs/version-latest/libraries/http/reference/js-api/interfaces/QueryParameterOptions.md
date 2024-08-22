---
jsApi: true
title: "[I] QueryParameterOptions"

---
## Extends

- `Required`<`Omit`<`QueryOptions`, `"format"`\>\>

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| `explode` | `readonly` | `boolean` | - | `Required.explode` |
| ~~`format?`~~ | `public` | \| `"form"` \| `"multi"` \| `"csv"` \| `"ssv"` \| `"tsv"` \| `"simple"` \| `"pipes"` | **Deprecated** use explode and `@encode` decorator instead. | - |
| `name` | `readonly` | `string` | - | `Required.name` |
| `type` | `public` | `"query"` | - | - |
