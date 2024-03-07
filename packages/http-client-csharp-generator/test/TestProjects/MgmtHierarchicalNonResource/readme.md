# MgmtHierarchicalNonResource

## AutoRest Configuration

> see https://aka.ms/autorest

``` yaml
azure-arm: true
require: $(this-folder)/../../../readme.md
input-file: $(this-folder)/MgmtHierarchicalNonResource.json
namespace: MgmtHierarchicalNonResource

request-path-to-resource-data:
  /subscriptions/{subscriptionId}/providers/Microsoft.Compute/locations/{location}/sharedGalleries/{galleryUniqueName}: SharedGallery

acronym-mapping:
  VCPU: VCpu
  VCPUs: VCpus
```
