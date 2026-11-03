# Microsoft TypeSpec Generator

The **Microsoft TypeSpec Generator** is a code generation library that is bundled with the `@typespec/http-client-csharp` emitter to transform TypeSpec API definitions into strongly-typed C# client libraries for accessing RESTful web services. The generator provides a modular, extensible architecture that supports multiple output formats and customization scenarios.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Build](#build)
- [Test](#test)

## Architecture Overview

See the architecture documentation [here](docs/architecture.md).

## Prerequisites

- [.NET 10.0 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/10.0) (use the SDK version pinned in [global.json](../global.json))

## Build

1. `dotnet build` (at root)

## Test

1. `dotnet test` (at root)
