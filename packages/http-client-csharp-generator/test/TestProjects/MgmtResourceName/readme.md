# ExactMatchInheritance

## AutoRest Configuration

> see https://aka.ms/autorest

``` yaml
title: MgmtResourceName
require: $(this-folder)/../../../readme.md
azure-arm: true
model-namespace: false
input-file: $(this-folder)/MgmtResourceName.json
namespace: MgmtResourceName
generate-model-factory: false # this is here only to test this option works
no-resource-suffix:
  - Disk
  - Memory

rename-mapping:
  NetworkResource: Network
  MemoryResource: Memory
```
