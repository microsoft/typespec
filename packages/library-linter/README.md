# TypeSpec Library Linter

## Installation

Install the package as a dev dependency.

```
npm install -D @typespec/library-linter
```

## Usage

Compile your library package. Any errors or warnings will be reported as TypeSpec diagnostics.

```bash
# At the root of your TypeSpec library.
tsp compile . --import @typespec/library-linter
```

## TypeSpec Library Best rules and best practices

| Rule name                  | Description                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `missing-namespace`        | Validate that every exported element from the library (models, JS functions, operations, etc.) is in a namespace.                 |
| `missing-signature`        | Validate that every exported JS decorator function has a matching `extern dec` declaration.                                       |
| `missing-documentation`    | Validate that every public declaration and member (properties, enum members, parameters, template parameters) has documentation.  |
| `extraneous-documentation` | Validate that doc comments do not document things that do not exist, such as an unknown `@param` name or an unrecognized doc tag. |

Declarations in a namespace named `Private` and declarations marked `internal` are not part of the
public surface of a library and are excluded from the documentation rules.
