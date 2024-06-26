---
id: getting-started-http-02-service-definition
title: Service Definition and Metadata
---

# Service Definition and Metadata

A service definition in TypeSpec is a namespace that contains all the operations for the service. This namespace can carry top-level metadata such as the service name and version. TypeSpec provides several decorators to specify this metadata. While these decorators are optional, they add valuable information that can be used by tools and code generators to produce more informative and accurate outputs:

- **`@service`**: Marks a namespace as a service namespace. It accepts the following options:
  - `title`: The name of the service.
- **`@server`**: (From `TypeSpec.Http`) Specifies the host of the service. It can also accept parameters to define dynamic parts of the URL.

Here's an example that uses these to define a Pet Store service:

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
namespace PetStore;
```

The `@server` decorator can take a third parameter with additional parameters as necessary:

```typespec
@server("https://{region}.foo.com", "Regional endpoint", {
  /** Region name */
  region?: string = "westus",
})
```
