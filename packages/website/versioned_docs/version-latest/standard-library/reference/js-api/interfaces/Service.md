---
jsApi: true
title: "[I] Service"

---
## Extends

- [`ServiceDetails`](ServiceDetails.md)

## Properties

| Property | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ |
| `title?` | `string` | - | [`ServiceDetails`](ServiceDetails.md).`title` |
| `type` | [`Namespace`](Namespace.md) | - | - |
| ~~`version?`~~ | `string` | **Deprecated** Service version is deprecated. If wanting to describe a service versioning you can use the `@typespec/versioning` library. If wanting to describe the project version you can use the package.json version | [`ServiceDetails`](ServiceDetails.md).`version` |
