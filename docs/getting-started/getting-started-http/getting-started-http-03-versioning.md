---
id: getting-started-http-03-versioning
title: Versioning
---

# Versioning

TypeSpec includes the `@typespec/versioning` library for handling service versioning. This library allows you to define different versions of your API and manage changes over time.

Versioning is important for maintaining backward compatibility and ensuring that clients can continue to use your API as it evolves.

It may seem premature to introduce versioning before we even have a spec, but it's worthwhile to consider versioning from the beginning of your API design process to avoid breaking changes later on.

## Using the `@versioned` decorator

The `@versioned` decorator is used to mark a namespace as versioned by a provided enum. This enum describes the supported versions of the service.

Here's an example that extends our Pet Store service to include versioning:

```typespec
import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;

/**
 * This is a sample Pet Store server.
 */
@service({
  title: "Pet Store Service",
})
@server("https://example.com", "Single server endpoint")
@versioned(Versions)
namespace PetStore;
enum Versions {
  v1: "1.0.0",
  v2: "2.0.0",
}
```

We'll make use of the versioning introduced here in an upcoming section of this guide.
