---
title: Overview
---

# REST

TypeSpec has an official REST API "binding" called `@typespec/rest`. It's a set of TypeSpec declarations and decorators that describe REST APIs and can be used by code generators to generate OpenAPI descriptions, implementation code, and the like.

## Installation

In your typespec project

```bash
npm install @typespec/rest
```

## Details

- [References](./reference/index.md)
  - [Decorators](./reference/decorators.md)
  - [Data types](./reference/data-types.md)
  - [Interface and operations](./reference/interfaces.md)

## Cheat sheet

## Resource Routing

_Details: [Resource Routing](./resource-routing.md)_

| Feature                  | Example                                                                             | Resolved Route |
| ------------------------ | ----------------------------------------------------------------------------------- | -------------- |
| Auto route               | `@autoRoute op get(@segment("pets") @path id: string): void`                        | `/pets/{id}`   |
| Custom segment seperator | `@autoRoute op get(@segment("pets") @path @segmentSeparator(":") id: string): void` | `:pets/{id}`   |
