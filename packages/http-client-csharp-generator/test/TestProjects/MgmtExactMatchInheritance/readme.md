# MgmtExactMatchInheritance

## AutoRest Configuration

> see https://aka.ms/autorest

``` yaml
title: MgmtExactMatchInheritance
require: $(this-folder)/../../../readme.md
azure-arm: true
model-namespace: false
input-file: $(this-folder)/MgmtExactMatchInheritance.json
namespace: MgmtExactMatchInheritance
format-by-name-rules:
  'tenantId': 'uuid'
  'resourceType': 'resource-type'
  'etag': 'etag'
  'location': 'azure-location'
  '*Uri': 'Uri'
  '*Uris': 'Uri'

# the remover will remove this since this is not internally used or a reference type if we do not have this configuration
keep-orphaned-models:
- ExactMatchModel11

rename-mapping:
  ExactMatchModel11.type: ResourceType

models-to-treat-empty-string-as-null:
- ExactMatchModel11
- ExactMatchModel1Data

additional-intrinsic-types-to-treat-empty-string-as-null:
- ResourceType
- IPAddress

directive:
  - from: MgmtExactMatchInheritance.json
    where: $.definitions.ExactMatchModel1.properties
    transform: >
       $.type1["x-ms-format"] = "resource-type";
       $.type3["x-ms-format"] = "ip-address";
       $.type4["x-ms-format"] = "object";
```
