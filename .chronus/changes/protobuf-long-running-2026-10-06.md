---
changeKind: feature
packages:
  - "@typespec/protobuf"
---

Add `LongRunningOperation<Response, Metadata>` for long-running operations ([AIP-151](https://google.aip.dev/151)), and `WellKnown.Operation`. An operation that returns `LongRunningOperation` returns a `google.longrunning.Operation`, and the emitter writes its response and metadata types in the method's `google.longrunning.operation_info` option.

```tsp
importBooks(...ImportBooksRequest): LongRunningOperation<ImportBooksResponse, ImportBooksMetadata>;
```

```proto
rpc ImportBooks(ImportBooksRequest) returns (google.longrunning.Operation) {
  option (google.longrunning.operation_info) = {
    response_type: "ImportBooksResponse"
    metadata_type: "ImportBooksMetadata"
  };
}
```
