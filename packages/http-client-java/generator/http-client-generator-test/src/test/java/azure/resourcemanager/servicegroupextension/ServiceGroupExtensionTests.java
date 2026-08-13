// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.resourcemanager.servicegroupextension;

import azure.resourcemanager.servicegroupextension.fluent.models.ServiceGroupExtensionResourceInner;
import azure.resourcemanager.servicegroupextension.models.ProvisioningState;
import azure.resourcemanager.servicegroupextension.models.ServiceGroupExtensionResource;
import azure.resourcemanager.servicegroupextension.models.ServiceGroupExtensionResourceProperties;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;

public class ServiceGroupExtensionTests {

    private static final String SERVICE_GROUP_ID = "test-sg";
    private static final String RESOURCE_NAME = "resource";
    private static final String RESOURCE_TYPE = "Microsoft.ServiceGroupExtension/serviceGroupExtensionResources";

    private final ServiceGroupExtensionManager manager
        = ServiceGroupExtensionManager.authenticate(ArmUtils.createTestHttpPipeline(), ArmUtils.getAzureProfile());

    @Test
    public void testGet() {
        assertResource(manager.serviceGroupExtensionResources().get(SERVICE_GROUP_ID, RESOURCE_NAME), "valid");
    }

    @Test
    public void testCreateOrUpdate() {
        ServiceGroupExtensionResource resource = manager.serviceGroupExtensionResources()
            .createOrUpdate(SERVICE_GROUP_ID, RESOURCE_NAME, createResource("valid"));

        assertResource(resource, "valid");
    }

    @Test
    public void testUpdate() {
        ServiceGroupExtensionResource resource = manager.serviceGroupExtensionResources()
            .update(SERVICE_GROUP_ID, RESOURCE_NAME, createResource("valid2"));

        assertResource(resource, "valid2");
    }

    @Test
    public void testDelete() {
        manager.serviceGroupExtensionResources().deleteByResourceGroup(SERVICE_GROUP_ID, RESOURCE_NAME);
    }

    @Test
    public void testListByServiceGroup() {
        List<ServiceGroupExtensionResource> resources = manager.serviceGroupExtensionResources()
            .listByServiceGroup(SERVICE_GROUP_ID)
            .stream()
            .collect(Collectors.toList());

        Assertions.assertEquals(1, resources.size());
        assertResource(resources.get(0), "valid");
    }

    private static ServiceGroupExtensionResourceInner createResource(String description) {
        return new ServiceGroupExtensionResourceInner()
            .withProperties(new ServiceGroupExtensionResourceProperties().withDescription(description));
    }

    private static void assertResource(ServiceGroupExtensionResource resource, String description) {
        Assertions.assertNotNull(resource);
        Assertions.assertEquals(RESOURCE_NAME, resource.name());
        Assertions.assertEquals(RESOURCE_TYPE, resource.type());
        Assertions.assertNotNull(resource.properties());
        Assertions.assertEquals(description, resource.properties().description());
        Assertions.assertEquals(ProvisioningState.SUCCEEDED, resource.properties().provisioningState());
    }
}
