# SingletonResource

## AutoRest Configuration

> see https://aka.ms/autorest

``` yaml
title: MgmtSingletonResource
require: $(this-folder)/../../../readme.md
azure-arm: true
model-namespace: false
input-file: $(this-folder)/MgmtSingletonResource.json
namespace: MgmtSingletonResource

request-path-to-singleton-resource:
  /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/cars/{carName}/brakes/{default}: brakes/default
```
