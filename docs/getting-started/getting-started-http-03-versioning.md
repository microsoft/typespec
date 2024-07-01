---
id: getting-started-http-03-versioning
title: Versioning
---

# Versioning

TypeSpec includes the `@typespec/versioning` library for handling service versioning. This library allows you to define different versions of your API and manage changes over time.

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
namespace PetStore {
  enum Versions {
    v1: "1.0.0",
    v2: "2.0.0",
  }
}
```

---

[Previous: Service Definition and Metadata](./getting-started-http-02-service-definition.md) | [Next: Resources and Routes](./getting-started-http-04-resources-routes.md)
