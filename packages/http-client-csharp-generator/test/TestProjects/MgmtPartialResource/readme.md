# ExactMatchInheritance

## AutoRest Configuration

> see https://aka.ms/autorest

``` yaml
title: MgmtPartialResource
require: $(this-folder)/../../../readme.md
azure-arm: true
model-namespace: false
input-file: $(this-folder)/MgmtPartialResource.json
namespace: MgmtPartialResource

request-path-to-resource-name:
  /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/virtualMachineScaleSets/{virtualMachineScaleSetName}: PartialVmss

partial-resources:
  /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/virtualMachineScaleSets/{virtualMachineScaleSetName}: VirtualMachineScaleSet
  /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/virtualMachines/{vmName}: VirtualMachine

override-operation-name:
  PublicIPAddresses_ListVirtualMachineScaleSetPublicIPAddresses: GetPublicIPAddresses
```
