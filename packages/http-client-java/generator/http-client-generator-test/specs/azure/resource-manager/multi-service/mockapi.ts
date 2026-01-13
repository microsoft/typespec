import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// Mock data for Compute (VirtualMachine)
const SUBSCRIPTION_ID = "00000000-0000-0000-0000-000000000000";
const RESOURCE_GROUP = "test-rg";
const LOCATION = "eastus";

const virtualMachine = {
  id: `/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/vm1`,
  name: "vm1",
  type: "Microsoft.Compute/virtualMachines",
  location: LOCATION,
  properties: {
    provisioningState: "Succeeded",
  },
};

// Mock data for ComputeDisk (Disk)
const disk = {
  id: `/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Compute/disks/disk1`,
  name: "disk1",
  type: "Microsoft.Compute/disks",
  location: LOCATION,
  properties: {
    provisioningState: "Succeeded",
  },
};

// Scenario: Get Virtual Machine
Scenarios.Azure_ResourceManager_MultiService_Compute_VirtualMachines_get = passOnSuccess([
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/vm1`,
    method: "get",
    request: {
      query: {
        "api-version": "2025-04-01",
      },
    },
    response: {
      status: 200,
      body: json(virtualMachine),
    },
    kind: "MockApiDefinition",
  },
]);

// Scenario: Create or Update Virtual Machine
Scenarios.Azure_ResourceManager_MultiService_Compute_VirtualMachines_createOrUpdate = passOnSuccess(
  [
    {
      uri: `/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Compute/virtualMachines/vm1`,
      method: "put",
      request: {
        query: {
          "api-version": "2025-04-01",
        },
        body: json({
          location: LOCATION,
          properties: {},
        }),
      },
      response: {
        status: 200,
        body: json(virtualMachine),
      },
      kind: "MockApiDefinition",
    },
  ],
);

// Scenario: Get Disk
Scenarios.Azure_ResourceManager_MultiService_ComputeDisk_Disks_get = passOnSuccess([
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Compute/disks/disk1`,
    method: "get",
    request: {
      query: {
        "api-version": "2025-01-02",
      },
    },
    response: {
      status: 200,
      body: json(disk),
    },
    kind: "MockApiDefinition",
  },
]);

// Scenario: Create or Update Disk
Scenarios.Azure_ResourceManager_MultiService_ComputeDisk_Disks_createOrUpdate = passOnSuccess([
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.Compute/disks/disk1`,
    method: "put",
    request: {
      query: {
        "api-version": "2025-01-02",
      },
      body: json({
        location: LOCATION,
        properties: {},
      }),
    },
    response: {
      status: 200,
      body: json(disk),
    },
    kind: "MockApiDefinition",
  },
]);
