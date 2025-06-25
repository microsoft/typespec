# Microsoft TypeSpec Generator

The **Microsoft TypeSpec Generator** is a code generation library that is bundled with the `@typespec/http-client-csharp` emitter to transform TypeSpec API definitions into strongly-typed C# client libraries for accessing RESTful web services. The generator provides a modular, extensible architecture that supports multiple output formats and customization scenarios.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Generator Pipeline](#generator-pipeline)
- [Extensibility Framework](#extensibility-framework)
- [Testing Strategy](#testing-strategy)
- [Prerequisites](#prerequisites)
- [Build](#build)
- [Test](#test)

## Architecture Overview

See the architecture documentation [here](docs/architecture.md).

## Prerequisites

- [.NET Core SDK (8.0.x)](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)

## Build

1. `dotnet build` (at root)

## Test

1. `dotnet test` (at root)
