---
title: Overview
---

# Http and rest

Cadl has an official REST API "binding" called `@cadl-lang/rest`. It's a set of Cadl declarations and decorators that describe REST APIs and can be used by code generators to generate OpenAPI descriptions, implementation code, and the like.

## Installation

In your cadl project

```bash
npm install @cadl-lang/rest
```

## Details

- [References](./reference/index.md)
  - [Decorators](./reference/decorators.md)
  - [Data types](./reference/data-types.md)
  - [Interface and operations](./reference/interfaces.md)
- [Authentication](./authentication.md)

## Cheat sheet

## Verb

| Feature          | Example                     |
| ---------------- | --------------------------- |
| Get operation    | `@get op read(): void`      |
| Put operation    | `@put op set(): void`       |
| Post operation   | `@post op add(): void`      |
| Patch operation  | `@patch op patch(): void`   |
| Delete operation | `@delete op delete(): void` |
| Head operation   | `@head op read(): void`     |

## Routing

| Feature                            | Example                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| Fixed route                        | `@route("/pets") op list(): Pet[]`                                                         |
| Route with path parameter          | `@route("/pets/{petId}") op getPet(petId: string): Pet`                                    |
| Route with multiple path parameter | `@route("/stores/{storeId}/pets/{petId}/") op getPet(storeId: string, petId: string): Pet` |

## Resource Routing

| Feature                  | Example                                                                             | Resolved Route |
| ------------------------ | ----------------------------------------------------------------------------------- | -------------- |
| Auto route               | `@autoRoute op get(@segment("pets") @path id: string): void`                        | `/pets/{id}`   |
| Custom segment seperator | `@autoRoute op get(@segment("pets") @path @segmentSeparator(":") id: string): void` | `:pets/{id}`   |

## Data types

| Feature                 | Example                                     |
| ----------------------- | ------------------------------------------- |
| Request header          | `op read(@header traceparent: string): Pet` |
| Response header         | `op read(): {@header eTag: string, ...Pet}` |
| Query parameter         | `op list(@query filter: string): Pet[]`     |
| Explicit body parameter | `op add(@body pet: Pet): void`              |
| Implicit body parameter | `op add(...Pet): void`                      |
| Status code             | `op read(): {@statusCode _: 200, ...Pet}`   |

## Server

| Feature       | Example                                                                               |
| ------------- | ------------------------------------------------------------------------------------- |
| Single        | `@server("https://example.com", "Example 1 endpoint")`                                |
| Multiple      | `@server("https://example1.com", "E1") @server("https://example2.com", "E2")`         |
| Parameterized | `@server("https://{region}.example.com", "Region scoped endpoint", {region: string})` |

## Authentication

_Details: [Authentication](./authentication.md)_

| Feature         | Example                                     |
| --------------- | ------------------------------------------- |
| Basic auth      | `@useAuth(BasicAuth)`                       |
| Bearer auth     | `@useAuth(BearerAuth)`                      |
| Api key auth    | `@useAuth(ApiKeyAuth<"header", "Api-Key">)` |
| OAuth2 key auth | `@useAuth(OAuth2Flow<[MyScope]>)`           |
