---
title: Cheat sheet
---

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
| API key auth    | `@useAuth(ApiKeyAuth<"header", "Api-Key">)` |
| OAuth2 key auth | `@useAuth(OAuth2Flow<[MyScope]>)`           |
