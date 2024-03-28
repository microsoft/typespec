# MgmtMockAndSample

## Generated code configuration

Run `dotnet build /t:GenerateCode` to generate code.

``` yaml
azure-arm: true
title: MgmtMockAndSample
library-name: MgmtMockAndSample
require: $(this-folder)/../../../../readme.md
input-file:
- $(this-folder)/../specification/mockSwagger/keyvault.json
- $(this-folder)/../specification/mockSwagger/managedHsm.json
- $(this-folder)/../specification/mockSwagger/network.json
- $(this-folder)/../specification/mockSwagger/providers.json
- $(this-folder)/../specification/mockSwagger/authorization.json
- $(this-folder)/../specification/mockSwagger/tenantActivityLogs_API.json
- $(this-folder)/../specification/mockSwagger/resources.json
- $(this-folder)/../specification/mockSwagger/guestconfiguration.json
clear-output-folder: true
namespace: MgmtMockAndSample
modelerfour:
  lenient-model-deduplication: true

include-x-ms-examples-original-file: false
sample-gen:
  mock: true
  sample: true
  output-folder: $(this-folder)../tests/Generated
  clear-output-folder: true
  skipped-operations: # only to test if the configuration works
  - Vaults_GetDeleted
  - Vaults_Update

generate-arm-resource-extensions:
- /{scope}/providers/Microsoft.Authorization/roleAssignments/{roleAssignmentName}

parameterized-scopes:
- /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/virtualMachines/{vmName}

list-exception:
- /subscriptions/{subscriptionId}/providers/Microsoft.KeyVault/locations/{location}/deletedVaults/{vaultName}
- /subscriptions/{subscriptionId}/providers/Microsoft.KeyVault/locations/{location}/deletedManagedHSMs/{name}

request-path-to-parent:
  /subscriptions/{subscriptionId}/providers/Microsoft.Authorization/roleAssignments/{roleAssignmentName}/validate: /{scope}/providers/Microsoft.Authorization/roleAssignments/{roleAssignmentName}

format-by-name-rules:
  'tenantId': 'uuid'
  'resourceType': 'resource-type'
  'location': 'azure-location'
  'ETag': 'etag'
  '*Uri': 'Uri'
  '*Uris': 'Uri'

rename-mapping:
  Type: EncryptionType
  FirewallPolicyThreatIntelWhitelist.ipAddresses: -|ip-address

models-to-treat-empty-string-as-null:
- EventData
- ManagedHsmProperties

privileged-operations:
  Vaults_CreateOrUpdate: Test for privileged operations configuration

directive:
  - from: swagger-document
    where: $.paths
    transform: delete $['/subscriptions/{subscriptionId}/resources']
  - from: swagger-document
    where: $['definitions']['Sku']['properties']['family']
    transform: delete $['x-ms-client-default']
  - from: swagger-document
    where: $['definitions']['ManagedHsmSku']['properties']['family']
    transform: delete $['x-ms-client-default']
```
