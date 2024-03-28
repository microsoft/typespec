# MgmtScopeResource

## AutoRest Configuration

> see https://aka.ms/autorest

``` yaml
azure-arm: true
title: ResourceManagementClient
require: $(this-folder)/../../../readme.md
input-file: 
  - $(this-folder)/PolicyAssignments.json
  - $(this-folder)/Deployments.json
  - $(this-folder)/Links.json
  - $(this-folder)/vmInsightsOnboarding_API.json
  - $(this-folder)/guestconfiguration.json
  - $(this-folder)/consumption.json
namespace: MgmtScopeResource

parameterized-scopes:
- /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/virtualMachines/{vmName}

list-exception:
  - /{linkId}
request-path-to-resource-data:
  # model of this has id, type and name, but its type has the type of `object` instead of `string`
  /{linkId}: ResourceLink
request-path-to-parent:
  /{scope}/providers/Microsoft.Resources/links: /{linkId}
  # setting these to the same parent will automatically merge these operations
  /providers/Microsoft.Resources/deployments/{deploymentName}/whatIf: /{scope}/providers/Microsoft.Resources/deployments/{deploymentName}
  /subscriptions/{subscriptionId}/providers/Microsoft.Resources/deployments/{deploymentName}/whatIf: /{scope}/providers/Microsoft.Resources/deployments/{deploymentName}
  /providers/Microsoft.Management/managementGroups/{groupId}/providers/Microsoft.Resources/deployments/{deploymentName}/whatIf: /{scope}/providers/Microsoft.Resources/deployments/{deploymentName}
  /subscriptions/{subscriptionId}/resourcegroups/{resourceGroupName}/providers/Microsoft.Resources/deployments/{deploymentName}/whatIf: /{scope}/providers/Microsoft.Resources/deployments/{deploymentName}
request-path-to-resource-type:
  /{linkId}: Microsoft.Resources/links
request-path-to-scope-resource-types:
  /{scope}/providers/Microsoft.Resources/deployments/{deploymentName}:
    - subscriptions
    - resourceGroups
    - managementGroups
    - tenant
  /{scope}/providers/Microsoft.Resources/deployments:
    - subscriptions
    - resourceGroups
    - managementGroups
    - tenant
override-operation-name:
  ResourceLinks_ListAtSourceScope: GetAll
operation-positions:
  ResourceLinks_ListAtSourceScope: collection
generate-arm-resource-extensions:
- /{scope}/providers/Microsoft.Authorization/policyAssignments/{policyAssignmentName}
- /{resourceUri}/providers/Microsoft.Insights/vmInsightsOnboardingStatuses/default
- /subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/virtualMachines/{vmName}/providers/Microsoft.GuestConfiguration/guestConfigurationAssignments/{guestConfigurationAssignmentName} # only for test

patch-initializer-customization:
  Deployment:
    Properties: 'new DeploymentProperties(current.Properties.Mode.HasValue ? current.Properties.Mode.Value : DeploymentMode.Incremental)'
directive:
  # PolicyDefinition resource has the corresponding method written using `scope`, therefore the "ById" methods are no longer required. Remove those
  - remove-operation: FakePolicyAssignments_DeleteById
  - remove-operation: FakePolicyAssignments_CreateById
  - remove-operation: FakePolicyAssignments_GetById
  - from: Links.json
    where: $.definitions.ResourceLink.properties.type
    transform: >
       $["x-ms-client-name"] = "ResourceType";
       $["type"] = "string";
```
