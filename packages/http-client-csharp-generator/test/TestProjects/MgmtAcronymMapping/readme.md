# MgmtAcronymMapping

### AutoRest Configuration

> see https://aka.ms/autorest

``` yaml
azure-arm: true
require: $(this-folder)/../../../readme.md
input-file: $(this-folder)/MgmtAcronymMapping.json
namespace: MgmtAcronymMapping
model-namespace: false
public-clients: false
head-as-boolean: false
modelerfour:
  lenient-model-deduplication: true

keep-orphaned-models:
  VmDiskType

acronym-mapping:
  Os: OS
  Ip: IP
  Ips: IPs
  ID: Id
  IDs: Ids
  VM: Vm
  VMs: Vms
  VMScaleSet: VmScaleSet
  Ipsec: IPsec|ipsec
  IPSec: IPsec|ipsec
  P2s: P2S|p2s
  P2S: P2S|p2s

format-by-name-rules:
  'tenantId': 'uuid'
  'etag': 'etag'
  'location': 'azure-location'
  'contentType': 'content-type'
  '*Uri': 'Uri'
  '*Uris': 'Uri'

mgmt-debug:
  show-serialized-names: true

rename-mapping:
  SshPublicKey: SshPublicKeyInfo
  SshPublicKeyResource: SshPublicKey
  LogAnalyticsOperationResult: LogAnalytics
  RollingUpgradeStatusInfo: VirtualMachineScaleSetRollingUpgrade
  UpgradeOperationHistoricalStatusInfo.type: -|resource-type # this configuration does not change its property name, only changes its format to resource-type
  DiskSecurityTypes.ConfidentialVM_VMGuestStateOnlyEncryptedWithPlatformKey: ConfidentialVmGuestStateOnlyEncryptedWithPlatformKey
  AdditionalUnattendContent.backupFrequency: -|integer
  LogAnalyticsOperationResult.method: requestMethod|request-method
  LogAnalyticsOperationResult.content: -|any
  LogAnalyticsOperationResult.basePath: basePathUri|uri
  VirtualMachineScaleSetIPConfiguration.properties.ipAddresses: -|ip-address
  InstanceViewStatus.time: -|date-time

parameter-rename-mapping:
  Images_CreateOrUpdate:
    imageName: name
```
