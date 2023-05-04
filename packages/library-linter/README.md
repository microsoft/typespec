# TypeSpec Library Linter

## Installation

Install the package as a dev dependency.

```
npm install -D @typespec/library-linter
```

## Usage

Compile your library package. Any errors or warnings will be reported as typespec diagnostics.

```bash
# At the root of your typespec library.
tsp compile . --import @typespec/library-linter
```

## TypeSpec Library Best rules and best practices

| Rule name           | Description                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `missing-namespace` | Validate that every exported element from the library(Models, JS functions, operations, etc.) is in a namespace. |
