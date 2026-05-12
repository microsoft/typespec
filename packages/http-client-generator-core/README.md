# @typespec/http-client-generator-core

Protocol-agnostic core library for TypeSpec client SDK generation.

## Overview

This package provides the foundational types, interfaces, and infrastructure for generating client SDKs from TypeSpec definitions. It is designed to be **cloud-provider agnostic** — containing no Azure-specific concepts.

Azure-specific functionality (LRO, ARM, Azure Core utilities) is provided by `@azure-tools/typespec-client-generator-core`, which extends this package.

## Architecture

```
@typespec/http-client-generator-core (this package)
├── Core type graph (SdkType, SdkModelType, SdkEnumType, etc.)
├── Client/operation interfaces (SdkClient, SdkClientType, SdkServiceMethod)
├── HTTP operation mapping (SdkHttpOperation, SdkHttpParameter)
├── Paging support (SdkPagingServiceMethod, SdkPagingServiceMetadata)
├── Decorator infrastructure (@clientName, @client, @access, @usage, etc.)
├── Context management (TCGCContext, SdkContext)
└── Example types (SdkHttpOperationExample, SdkExampleValue)

@azure-tools/typespec-client-generator-core (Azure extension)
├── LRO support (SdkLroServiceMethod, SdkLroPagingServiceMethod, SdkLroServiceMetadata)
├── ARM detection and subscription ID handling
├── Azure Core utilities (getUnionAsEnum, isPreviewVersion)
├── Azure-specific defaults and configurations
└── Re-exports everything from core for backward compatibility
```

## Key Design Decisions

### Extensible Method Types

The `SdkServiceMethod` union in core includes only `basic` and `paging` variants:

```typescript
type SdkCoreServiceMethod<T> = SdkBasicServiceMethod<T> | SdkPagingServiceMethod<T>;
```

The Azure extension adds LRO variants:

```typescript
type SdkServiceMethod<T> = SdkCoreServiceMethod<T> | SdkLroServiceMethod<T> | SdkLroPagingServiceMethod<T>;
```

### No Azure Dependencies

This package has **zero** dependencies on:
- `@azure-tools/typespec-azure-core`
- `@azure-tools/typespec-azure-resource-manager`
- Any Azure-specific TypeSpec libraries

### TSP Namespace

Core decorators use `TypeSpec.ClientGenerator.Core` namespace.
Azure-specific decorators remain in `Azure.ClientGenerator.Core` namespace.
