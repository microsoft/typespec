---
title: Directives
---

Directives are predefined annotations that attach to the syntax nodes unlike decorators which will cary over with `model is`, `op is`, etc. This means any syntax node is able to have a directive(e.g `alias`).

These are the available directives:

- [#deprecated](#deprecated)
- [#suppress](#suppress)

## #deprecated

The deprecated directive allows marking a node and through it its type as deprecated. It takes a single argument which is the deprecation message.

```tsp
#deprecated "Use NewUser instead"
model LegacyUser {}
```

Using that type will result in a deprecation warning:

```tsp
model Post {
  author: LegacyUser;
  //      ^ warning: Deprecated: Use NewUser instead
}
```

<!-- cspell:disable -->

```ansi frame="terminal"
$ tsp compile .

Diagnostics were reported during compilation:

[36mmain.tsp[39m:[33m5[39m:[33m11[39m - [33mwarning[39m[90m deprecated[39m: Deprecated: Use NewUser instead
> 5 |   author: LegacyUser;
    |           ^^^^^^^^^^

Found  1 warning.
```

<!-- cspell:enable -->

Adding another `#suppress` on a node that reports a deprecation warning will suppress the warning automatically.

```tsp
model Post {
  #suppress "Use newAuthor property instead"
  author: LegacyUser; // no need to also suppress the deprecated diagnostic about usage of LegacyUser
}
```

### Api

A library or emitter can check if a type was annotated with the deprecated directive using the `isDeprecated` method and/or get the message using `getDeprecationDetails`.

```ts
import { getDeprecationDetails, isDeprecated } from "@typespec/compiler";
const isDeprecated = isDeprecated(program, type);
const details = getDeprecationDetails(program, type);
```

## #suppress

Suppress directive allows suppressing a specific warning diagnostic. It takes 2 arguments:

- The diagnostic code to suppress
- A message to justify the suppression

:::note
Errors are not suppressable
:::

```tsp
model Post {
  #suppress "deprecated" "We are not ready to migrate yet"
  author: LegacyUser;
}
```

```tsp
#suppress "@typespec/http/no-service-found" "standard library route"
namespace Lib {
  @route("/test") op get(): string;
}
```

### Short diagnostic codes

Diagnostic codes from a library are prefixed with the package name (e.g. `@typespec/http/no-service-found`), which can get verbose. You can also reference a diagnostic using its **short name**, where the package scope is stripped:

- `@typespec/<name>` &rarr; `<name>` (e.g. `@typespec/http/no-service-found` &rarr; `http/no-service-found`)
- `@<scope>/typespec-<name>` &rarr; `<name>` (e.g. `@azure-tools/typespec-autorest/no-foo` &rarr; `autorest/no-foo`)
- A library may also declare a custom `alias` (e.g. `tcgc/no-foo`).

```tsp
#suppress "http/no-service-found" "standard library route"
namespace Lib {
  @route("/test") op get(): string;
}
```

The full name is always accepted. If two loaded libraries would resolve to the same short name, that short name becomes ambiguous: referencing it reports a warning and you must use the full name for those libraries.

### Api

Use `collectSuppressions` from `@typespec/compiler/ast` to inspect directives without compiling a project or loading its dependencies:

```ts
import { createSourceFile } from "@typespec/compiler";
import { collectSuppressions, parse } from "@typespec/compiler/ast";

const script = parse(createSourceFile(text, "main.tsp"));
if (script.parseDiagnostics.some((diagnostic) => diagnostic.severity === "error")) {
  throw new Error("Cannot produce a complete inventory from invalid TypeSpec.");
}

for (const { directive, target, location, scope } of collectSuppressions(script)) {
  console.log(directive.code, directive.message);
  console.log(location.file.path, location.file.getLineAndCharacterOfPosition(location.pos));
  console.log(scope.map(({ name }) => name));
}
```

Each result contains the directive, its attached syntax node (`target`), a source range, and structural declaration context (`scope`). Context is ordered outermost first and includes file-scoped namespaces and the target when it is a declaration or member. Anonymous containers have no name. Context is not a unique identifier or a description of which diagnostics the directive suppresses; tools choose their own reporting identities.

Results are in source order. Separate duplicate directives are retained, but multiple AST references to the same directive are returned once. Codes are preserved without resolving short names or aliases, and collection does not check whether a directive is used or effective. Missing justifications are returned as empty strings.

Locations work on unbound parsed files. Use `location.file.text.slice(location.pos, location.end)` for source text; directive ranges can include trailing trivia. Line and character positions are zero-based. The collector does not modify the AST and is subject to the [AST compatibility policy](../handbook/breaking-change-policy.mdx).
