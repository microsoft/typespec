# ExactMatchInheritance

## AutoRest Configuration

> see https://aka.ms/autorest

``` yaml
title: MgmtParamOrdering
require: $(this-folder)/../../../readme.md
azure-arm: true
model-namespace: false
input-file: $(this-folder)/MgmtParamOrdering.json
namespace: MgmtParamOrdering
modelerfour:
  lenient-model-deduplication: true
format-by-name-rules:
  'tenantId': 'uuid'
  'resourceType': 'resource-type'
  'etag': 'etag'
  'location': 'azure-location'
  '*Uri': 'Uri'
  '*Uris': 'Uri'

# the remover will remove this since this is not internally used or a reference type if we do not have this configuration
keep-orphaned-models:
- LocationFormatObject
```
