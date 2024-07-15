---
title: Getting Started with TypeSpec For Http
pagination_next: getting-started/getting-started-http/setup # Explicitly needed as its also being the category page https://github.com/facebook/docusaurus/issues/6183
---

# Getting Started with TypeSpec for HTTP

Let's create a REST API definition with TypeSpec. TypeSpec has an official HTTP API "binding" called `@typespec/http`. It's a set of TypeSpec declarations and decorators that describe HTTP APIs and can be used by code generators to generate OpenAPI descriptions, implementation code, and the like. Built on top of the HTTP library, there is the REST library `@typespec/rest` which provides some REST concepts like resources.

TypeSpec also has an official OpenAPI emitter called `@typespec/openapi3` that consumes the HTTP API bindings and emits standard [OpenAPI 3.0](https://spec.openapis.org/oas/v3.0.3) descriptions. This can then be fed into any OpenAPI code generation pipeline.

Additionally, TypeSpec includes the `@typespec/versioning` library for handling service versioning.

References:

- [HTTP library](../../libraries/http/reference)
- [REST library](../../libraries/rest/reference)
- [OpenAPI 3 emitter](../../emitters/openapi3/reference)
- [Versioning library](../../libraries/versioning/reference)
