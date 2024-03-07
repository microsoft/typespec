### In order to get the large files, tests fail with "Stream was too long" exception. To fix this, don't download response from buffer.

``` yaml
directive:
- from: swagger-document
  where: $..[?(@.operationId=='files_GetFile' || @.operationId=='files_GetEmptyFile' || @.operationId=='files_GetFileLarge')]
  transform: $["x-csharp-buffer-response"] = false;
```