**Client Initialization Algorithm**

This document describes how `@typespec/http-client` computes client constructor parameters and initialization strategy by default, and how it can be customized via the `@clientInitialization` decorator.

---

## 1. Endpoint Parameter

- Derived from the `@server` decorator on the service namespace.
- If the server URL is a constant string:
  - The client exposes a templated endpoint parameter with a default value set to that constant.
- If the server URL includes path or query template parameters:
  - The endpoint parameter type is the union of:
    - A fully overridable `string` URL, and
    - A typed template object accepting only the defined parameters.
- When multiple `@server` definitions exist:
  - The endpoint parameter is a union of all server URL possibilities (constant or templated).

## 2. Credential Parameter

- Derived from the `@useAuth` decorator on the service namespace.
- The client constructor includes a credential parameter matching the selected auth policy interface.

## 3. Initialization Strategy (Default)

- By default, each generated client class manages its own initialization:
  1. Endpoint
  2. Credential

---

## Implicit Initialization (no @clientInitialization decorator)

The following parameters and default instantiation strategy apply when no explicit `@clientInitialization` decorator is present:

- **Initialization mode** is set to `individual`, where each client is constructed independently.

---

## Explicit Initialization Customization

- The `@clientInitialization` decorator allows overriding the default behavior:
  - **Additional client-level parameters** can be added or removed.
  - **Initialization mode** can be specified as:
    - `individual`: each client is constructed independently,
    - `hierarchical`: sub-clients are created via their parent client,
    - `both`: supporting both modes via overloads.

---

```mermaid
flowchart TD
    A[Start] --> B{Is @clientInitialization present?}
    B -->|No| Implicit[Implicit Initialization]
    B -->|Yes| Explicit[Explicit Initialization]

    subgraph "Default (Implicit) Initialization"
      direction TB
      Imp1[Derive endpoint parameter from @server]
      Imp2[Derive credential parameter from @useAuth]
      Imp3{Service versioned?}
      Imp3 -->|Yes| Imp3a[Elevate api-version to client]
      Imp3 -->|No| Imp3b[Skip api-version]
      Imp4{ARM service detected?}
      Imp4 -->|Yes| Imp4a[Elevate subscriptionId to client]
      Imp4 -->|No| Imp4b[Skip subscriptionId]
      Imp5[Instantiate client and sub-clients]
      Imp1 --> Imp2 --> Imp3 --> Imp4 --> Imp5 --> EndImplicit[End]
    end

    subgraph "Explicit Initialization with @clientInitialization"
      direction TB
      Exp1[Read decorator settings]
      Exp2{Modify parameters?}
      Exp2 -->|Yes| Exp2a[Add or remove constructor params]
      Exp2 -->|No| Exp2b[Keep default params]
      Exp3{Choose init mode}
      Exp3 -->|individual| Exp3a[Init each client independently]
      Exp3 -->|hierarchical| Exp3b[Parent initializes sub-clients]
      Exp3 -->|both| Exp3c[Provide overloads for both modes]
      Exp1 --> Exp2 --> Exp3 --> EndExplicit[End]
    end
```
