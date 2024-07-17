---
jsApi: true
title: "[I] AdditionalInfo"

---
OpenAPI additional information

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| `contact?` | [`Contact`](Contact.md) | The contact information for the exposed API. |
| `description?` | `string` | A description of the API. Overrides the `@doc` provided on the service namespace. |
| `license?` | [`License`](License.md) | The license information for the exposed API. |
| `summary?` | `string` | A short summary of the API. Overrides the `@summary` provided on the service namespace. |
| `termsOfService?` | `string` | A URL to the Terms of Service for the API. MUST be in the format of a URL. |
| `title?` | `string` | The title of the API. Overrides the `@service` title. |
| `version?` | `string` | The version of the OpenAPI document (which is distinct from the OpenAPI Specification version or the API implementation version). |
