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

### Api

There is currently no exposed api to resolve suppresssions
