---
title: Cheat sheet
---

## Resource Routing

_Details: [Resource Routing](./resource-routing.md)_

| Feature                  | Example                                                                             | Resolved Route |
| ------------------------ | ----------------------------------------------------------------------------------- | -------------- |
| Auto route               | `@autoRoute op get(@segment("pets") @path id: string): void`                        | `/pets/{id}`   |
| Custom segment seperator | `@autoRoute op get(@segment("pets") @path @segmentSeparator(":") id: string): void` | `:pets/{id}`   |
