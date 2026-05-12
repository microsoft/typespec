# Python Emitter Migration Example

This document shows how the Python emitter (`@typespec/http-client-python`) would
update its imports after the TCGC split.

## Summary

| Import Source | What it provides |
|---|---|
| `@typespec/http-client-generator-core` | All core types, context, utilities |
| `@azure-tools/typespec-client-generator-core` | LRO types + Azure-specific helpers (re-exports core) |

Most files switch entirely to the core package. Only files dealing with LRO or
Azure-specific helpers need the Azure extension.

---

## emitter.ts

```typescript
// BEFORE
import { createSdkContext } from "@azure-tools/typespec-client-generator-core";

// AFTER — createSdkContext is a core function
import { createSdkContext } from "@typespec/http-client-generator-core";
```

---

## lib.ts

```typescript
// BEFORE
import {
  SdkContext,
  SdkType,
  UnbrandedSdkEmitterOptions,
} from "@azure-tools/typespec-client-generator-core";

// AFTER — all core types
import {
  SdkContext,
  SdkType,
  UnbrandedSdkEmitterOptions,
} from "@typespec/http-client-generator-core";
```

---

## types.ts

```typescript
// BEFORE
import {
  isHttpMetadata,
  SdkArrayType,
  SdkBuiltInType,
  SdkConstantType,
  SdkCredentialType,
  SdkDateTimeType,
  SdkDictionaryType,
  SdkDurationType,
  SdkEndpointType,
  SdkEnumType,
  SdkEnumValueType,
  SdkModelPropertyType,
  SdkModelType,
  SdkType,
  SdkUnionType,
  UsageFlags,
} from "@azure-tools/typespec-client-generator-core";

// AFTER — all core types and utilities
import {
  isHttpMetadata,
  SdkArrayType,
  SdkBuiltInType,
  SdkConstantType,
  SdkCredentialType,
  SdkDateTimeType,
  SdkDictionaryType,
  SdkDurationType,
  SdkEndpointType,
  SdkEnumType,
  SdkEnumValueType,
  SdkModelPropertyType,
  SdkModelType,
  SdkType,
  SdkUnionType,
  UsageFlags,
} from "@typespec/http-client-generator-core";
```

---

## utils.ts

```typescript
// BEFORE
import {
  InitializedByFlags,
  SdkCredentialParameter,
  SdkEndpointParameter,
  SdkHeaderParameter,
  SdkHttpParameter,
  SdkMethod,
  SdkMethodParameter,
  SdkModelPropertyType,
  SdkQueryParameter,
  SdkServiceMethod,
  SdkServiceOperation,
  SdkServiceResponseHeader,
  SdkType,
} from "@azure-tools/typespec-client-generator-core";

// AFTER — all core types
import {
  InitializedByFlags,
  SdkCredentialParameter,
  SdkEndpointParameter,
  SdkHeaderParameter,
  SdkHttpParameter,
  SdkMethod,
  SdkMethodParameter,
  SdkModelPropertyType,
  SdkQueryParameter,
  SdkServiceMethod,
  SdkServiceOperation,
  SdkServiceResponseHeader,
  SdkType,
} from "@typespec/http-client-generator-core";
```

---

## http.ts

```typescript
// BEFORE
import {
  getHttpOperationParameter,
  SdkBasicServiceMethod,
  SdkBodyParameter,
  SdkClientType,
  SdkHeaderParameter,
  SdkHttpErrorResponse,
  SdkHttpOperation,
  SdkHttpOperationExample,
  SdkHttpResponse,
  SdkLroPagingServiceMethod,
  SdkLroServiceMethod,
  SdkMethodParameter,
  SdkModelPropertyType,
  SdkPagingServiceMethod,
  SdkPathParameter,
  SdkQueryParameter,
  SdkServiceMethod,
  SdkServiceResponseHeader,
  SdkType,
  UsageFlags,
} from "@azure-tools/typespec-client-generator-core";

// AFTER — split between core and azure extension
import {
  getHttpOperationParameter,
  SdkBasicServiceMethod,
  SdkBodyParameter,
  SdkClientType,
  SdkHeaderParameter,
  SdkHttpErrorResponse,
  SdkHttpOperation,
  SdkHttpOperationExample,
  SdkHttpResponse,
  SdkMethodParameter,
  SdkModelPropertyType,
  SdkPagingServiceMethod,
  SdkPathParameter,
  SdkQueryParameter,
  SdkServiceResponseHeader,
  SdkType,
  UsageFlags,
} from "@typespec/http-client-generator-core";
// LRO types come from the Azure extension
import {
  SdkLroPagingServiceMethod,
  SdkLroServiceMethod,
} from "@azure-tools/typespec-client-generator-core";
// NOTE: SdkServiceMethod is re-exported from azure extension with LRO variants included
import type { SdkServiceMethod } from "@azure-tools/typespec-client-generator-core";
```

---

## code-model.ts

```typescript
// BEFORE
import {
  SdkBasicServiceMethod,
  SdkClientType,
  SdkCredentialParameter,
  SdkCredentialType,
  SdkEndpointParameter,
  SdkEndpointType,
  SdkLroPagingServiceMethod,
  SdkLroServiceMethod,
  SdkMethodParameter,
  SdkPagingServiceMethod,
  SdkServiceMethod,
  SdkServiceOperation,
  SdkUnionType,
  UsageFlags,
  getCrossLanguagePackageId,
  isAzureCoreModel,
} from "@azure-tools/typespec-client-generator-core";

// AFTER — core types from core, Azure-specific from extension
import {
  SdkBasicServiceMethod,
  SdkClientType,
  SdkCredentialParameter,
  SdkCredentialType,
  SdkEndpointParameter,
  SdkEndpointType,
  SdkMethodParameter,
  SdkPagingServiceMethod,
  SdkServiceOperation,
  SdkUnionType,
  UsageFlags,
  getCrossLanguagePackageId,
} from "@typespec/http-client-generator-core";
// Azure-specific: LRO types + Azure model detection
import {
  SdkLroPagingServiceMethod,
  SdkLroServiceMethod,
  SdkServiceMethod,
  isAzureCoreModel,
} from "@azure-tools/typespec-client-generator-core";
```

---

## package.json changes

```jsonc
{
  // BEFORE
  "peerDependencies": {
    "@azure-tools/typespec-client-generator-core": ">=0.67.0 <1.0.0"
  },
  "devDependencies": {
    "@azure-tools/typespec-client-generator-core": "~0.67.0"
  }

  // AFTER
  "peerDependencies": {
    "@typespec/http-client-generator-core": "workspace:^",
    // Still needed for LRO + isAzureCoreModel (optional peer for non-Azure usage)
    "@azure-tools/typespec-client-generator-core": ">=0.68.0 <1.0.0"
  },
  "devDependencies": {
    "@typespec/http-client-generator-core": "workspace:^",
    "@azure-tools/typespec-client-generator-core": "~0.68.0"
  }
}
```

---

## Key Observations

1. **4 out of 6 files** can switch entirely to `@typespec/http-client-generator-core`
   (emitter.ts, lib.ts, types.ts, utils.ts)

2. **2 files** need split imports (http.ts, code-model.ts) because they use:
   - `SdkLroServiceMethod` / `SdkLroPagingServiceMethod` — Azure LRO extension
   - `isAzureCoreModel` — Azure-specific helper
   - `SdkServiceMethod` (the full union including LRO) — Azure extension re-export

3. **Future state**: If/when the Python emitter drops Azure support from its core and
   moves Azure handling to a separate plugin, it could depend only on the core package.

4. **Backward compat**: The Azure package re-exports everything from core, so existing
   code continues to work without changes. Migration is opt-in and incremental.
