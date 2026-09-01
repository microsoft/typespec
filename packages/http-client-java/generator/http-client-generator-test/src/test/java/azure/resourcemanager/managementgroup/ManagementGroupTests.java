// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.resourcemanager.managementgroup;

import azure.resourcemanager.managementgroup.fluent.models.ManagementGroupChildResourceInner;
import azure.resourcemanager.managementgroup.models.ManagementGroupChildResource;
import azure.resourcemanager.managementgroup.models.ManagementGroupChildResourceProperties;
import azure.resourcemanager.managementgroup.models.ProvisioningState;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;

public class ManagementGroupTests {

    private static final String MANAGEMENT_GROUP_ID = "test-mg";
    private static final String RESOURCE_NAME = "resource";
    private static final String RESOURCE_TYPE = "Microsoft.ManagementGroupChild/managementGroupChildResources";
    private static final String RESOURCE_DESCRIPTION_VALID = "valid";
    private static final String RESOURCE_DESCRIPTION_VALID2 = "valid2";

    private final ManagementGroupManager manager
        = ManagementGroupManager.authenticate(ArmUtils.createTestHttpPipeline(), ArmUtils.getAzureProfile());

    @Test
    public void testGet() {
        ManagementGroupChildResource resource
            = manager.managementGroupChildResources().get(MANAGEMENT_GROUP_ID, RESOURCE_NAME);
        Assertions.assertNotNull(resource);
        Assertions.assertEquals(RESOURCE_NAME, resource.name());
        Assertions.assertEquals(RESOURCE_TYPE, resource.type());
        Assertions.assertNotNull(resource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, resource.properties().description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, resource.properties().provisioningState());
    }

    @Test
    public void testCreateOrUpdate() {
        ManagementGroupChildResource resource = manager.managementGroupChildResources()
            .createOrUpdate(MANAGEMENT_GROUP_ID, RESOURCE_NAME, new ManagementGroupChildResourceInner().withProperties(
                new ManagementGroupChildResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID)));
        Assertions.assertNotNull(resource);
        Assertions.assertEquals(RESOURCE_NAME, resource.name());
        Assertions.assertEquals(RESOURCE_TYPE, resource.type());
        Assertions.assertNotNull(resource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, resource.properties().description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, resource.properties().provisioningState());
    }

    @Test
    public void testUpdate() {
        ManagementGroupChildResource resource = manager.managementGroupChildResources()
            .update(MANAGEMENT_GROUP_ID, RESOURCE_NAME, new ManagementGroupChildResourceInner().withProperties(
                new ManagementGroupChildResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID2)));
        Assertions.assertNotNull(resource);
        Assertions.assertEquals(RESOURCE_NAME, resource.name());
        Assertions.assertNotNull(resource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, resource.properties().description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, resource.properties().provisioningState());
    }

    @Test
    public void testDelete() {
        manager.managementGroupChildResources().deleteByResourceGroup(MANAGEMENT_GROUP_ID, RESOURCE_NAME);
    }

    @Test
    public void testListByManagementGroup() {
        List<ManagementGroupChildResource> resources = manager.managementGroupChildResources()
            .listByManagementGroup(MANAGEMENT_GROUP_ID)
            .stream()
            .collect(Collectors.toList());
        Assertions.assertEquals(1, resources.size());
        ManagementGroupChildResource resource = resources.get(0);
        Assertions.assertNotNull(resource);
        Assertions.assertEquals(RESOURCE_NAME, resource.name());
        Assertions.assertEquals(RESOURCE_TYPE, resource.type());
        Assertions.assertNotNull(resource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, resource.properties().description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, resource.properties().provisioningState());
    }
}
