### Don't buffer downloads

``` yaml
directive:
- from: swagger-document
  where: $..[?(@.operationId=='files_GetFile' || @.operationId=='files_GetEmptyFile' || @.operationId=='files_GetFileLarge')]
  transform: $["x-csharp-buffer-response"] = false;
```