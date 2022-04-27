# Cadl Library Linter

## Installation

Install the package as a dev dependency.

```
npm install -D @cadl-lang/library-linter
```

## Usage

Compile your library package. Any errors or warnings will be reported as cadl diagnostics.

```bash
# At the root of your cadl library.
cadl compile . --import @cadl-lang/library-linter
```

## Cadl Library Best rules and best practices

| Rule name           | Description                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `missing-namespace` | Validate that every exported element from the library(Models, JS functions, operations, etc.) is in a namespace. |
