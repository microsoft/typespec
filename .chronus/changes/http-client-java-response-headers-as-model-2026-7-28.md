---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Add opt-in support for returning significant response headers as a strongly-typed model from the convenience method of a data-plane operation that has response headers but no response body (for example, a `HEAD` operation). Enable it per operation via the `responseHeadersAsModel` client option:

```typespec
@@clientOption(ResponseHeaderOp.getResourceMetadata, "responseHeadersAsModel", true, "java");
```

The convenience method then returns the generated header model (built directly from the response headers, without any serialization) instead of `void`, while the protocol method continues to return `Response<Void>`. Using the option on an operation that has a response body reports an error.
