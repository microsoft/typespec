// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.resourcemanager.resources;

import com.azure.core.management.Region;
import com.azure.core.util.Context;
import com.azure.resourcemanager.resources.fluent.models.SingletonTrackedResourceInner;
import com.azure.resourcemanager.resources.models.NestedProxyResource;
import com.azure.resourcemanager.resources.models.NestedProxyResourceProperties;
import com.azure.resourcemanager.resources.models.NotificationDetails;
import com.azure.resourcemanager.resources.models.ProvisioningState;
import com.azure.resourcemanager.resources.models.SingletonTrackedResource;
import com.azure.resourcemanager.resources.models.SingletonTrackedResourceProperties;
import com.azure.resourcemanager.resources.models.TopLevelTrackedResource;
import com.azure.resourcemanager.resources.models.TopLevelTrackedResourceProperties;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;

public class ArmResourceTest {
    private static final String TOP_LEVEL_TRACKED_RESOURCE_ID
        = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top";
    private static final String TOP_LEVEL_TRACKED_RESOURCE_NAME = "top";
    private static final String TOP_LEVEL_TRACKED_RESOURCE_TYPE
        = "Azure.ResourceManager.Resources/topLevelTrackedResources";
    private static final String NESTED_PROXY_RESOURCE_ID
        = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/nestedProxyResources/nested";
    private static final String NESTED_PROXY_RESOURCE_NAME = "nested";
    private static final String NESTED_PROXY_RESOURCE_TYPE
        = "Azure.ResourceManager.Resources/topLevelTrackedResources/top/nestedProxyResources";
    private static final Region TOP_LEVEL_TRACKED_RESOURCE_REGION = Region.US_EAST;
    private static final String RESOURCE_DESCRIPTION_VALID = "valid";
    private static final String RESOURCE_DESCRIPTION_VALID2 = "valid2";
    private static final ProvisioningState RESOURCE_PROVISIONING_STATE = ProvisioningState.SUCCEEDED;
    private static final String RESOURCE_GROUP_NAME = "test-rg";
    private static final String NOTIFICATION_DETAILS_MESSAGE = "Resource action at top level.";
    private final ResourcesManager manager
        = ResourcesManager.authenticate(ArmUtils.createTestHttpPipeline(), ArmUtils.getAzureProfile());

    @Test
    public void testTopLevelTrackedResource() {
        // TopLevelTrackedResources.createOrReplace
        TopLevelTrackedResource topLevelTrackedResource = manager.topLevels()
            .define(TOP_LEVEL_TRACKED_RESOURCE_NAME)
            .withRegion(Region.US_EAST)
            .withExistingResourceGroup(RESOURCE_GROUP_NAME)
            .withProperties(new TopLevelTrackedResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID))
            .create();
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_ID, topLevelTrackedResource.id());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_NAME, topLevelTrackedResource.name());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_TYPE, topLevelTrackedResource.type());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_REGION, topLevelTrackedResource.region());
        Assertions.assertNotNull(topLevelTrackedResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, topLevelTrackedResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, topLevelTrackedResource.properties().provisioningState());

        manager.topLevels()
            .actionSync(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME,
                new NotificationDetails().withMessage(NOTIFICATION_DETAILS_MESSAGE).withUrgent(true));

        topLevelTrackedResource
            .actionSync(new NotificationDetails().withMessage(NOTIFICATION_DETAILS_MESSAGE).withUrgent(true));

        // TopLevelTrackedResources.listByResourceGroup
        List<TopLevelTrackedResource> topLevelTrackedResourceList
            = manager.topLevels().listByResourceGroup(RESOURCE_GROUP_NAME).stream().collect(Collectors.toList());
        Assertions.assertEquals(1, topLevelTrackedResourceList.size());
        topLevelTrackedResource = topLevelTrackedResourceList.get(0);
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_ID, topLevelTrackedResource.id());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_NAME, topLevelTrackedResource.name());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_TYPE, topLevelTrackedResource.type());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_REGION, topLevelTrackedResource.region());
        Assertions.assertNotNull(topLevelTrackedResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, topLevelTrackedResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, topLevelTrackedResource.properties().provisioningState());

        // TopLevelTrackedResources.listBySubscription
        topLevelTrackedResourceList = manager.topLevels()
            .list()
            .stream()
            .filter(resource -> TOP_LEVEL_TRACKED_RESOURCE_ID.equals(resource.id()))
            .collect(Collectors.toList());
        Assertions.assertEquals(1, topLevelTrackedResourceList.size());
        topLevelTrackedResource = topLevelTrackedResourceList.get(0);
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_ID, topLevelTrackedResource.id());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_NAME, topLevelTrackedResource.name());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_TYPE, topLevelTrackedResource.type());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_REGION, topLevelTrackedResource.region());
        Assertions.assertNotNull(topLevelTrackedResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, topLevelTrackedResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, topLevelTrackedResource.properties().provisioningState());

        // TopLevelTrackedResources.get
        topLevelTrackedResource
            = manager.topLevels().getByResourceGroup(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME);
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_ID, topLevelTrackedResource.id());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_NAME, topLevelTrackedResource.name());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_TYPE, topLevelTrackedResource.type());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_REGION, topLevelTrackedResource.region());
        Assertions.assertNotNull(topLevelTrackedResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, topLevelTrackedResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, topLevelTrackedResource.properties().provisioningState());

        // TopLevelTrackedResources.update
        topLevelTrackedResource.update()
            .withProperties(new TopLevelTrackedResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID2))
            .apply();
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_ID, topLevelTrackedResource.id());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_NAME, topLevelTrackedResource.name());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_TYPE, topLevelTrackedResource.type());
        Assertions.assertEquals(TOP_LEVEL_TRACKED_RESOURCE_REGION, topLevelTrackedResource.region());
        Assertions.assertNotNull(topLevelTrackedResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, topLevelTrackedResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, topLevelTrackedResource.properties().provisioningState());

        // TopLevelTrackedResources.delete
        manager.topLevels().delete(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME, Context.NONE);
    }

    @Test
    public void testNestedProxyResource() {
        // NestedProxyResources.createOrReplace
        NestedProxyResource nestedProxyResource = manager.nesteds()
            .define(NESTED_PROXY_RESOURCE_NAME)
            .withExistingTopLevelTrackedResource(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME)
            .withProperties(new NestedProxyResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID))
            .create();
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_ID, nestedProxyResource.id());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_NAME, nestedProxyResource.name());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_TYPE, nestedProxyResource.type());
        Assertions.assertNotNull(nestedProxyResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, nestedProxyResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, nestedProxyResource.properties().provisioningState());

        // NestedProxyResources.listByTopLevelTrackedResource
        List<NestedProxyResource> nestedProxyResourceList = manager.nesteds()
            .listByTopLevelTrackedResource(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME)
            .stream()
            .collect(Collectors.toList());
        Assertions.assertEquals(1, nestedProxyResourceList.size());
        nestedProxyResource = nestedProxyResourceList.get(0);
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_ID, nestedProxyResource.id());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_NAME, nestedProxyResource.name());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_TYPE, nestedProxyResource.type());
        Assertions.assertNotNull(nestedProxyResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, nestedProxyResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, nestedProxyResource.properties().provisioningState());

        // NestedProxyResources.get
        nestedProxyResource
            = manager.nesteds().get(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME, NESTED_PROXY_RESOURCE_NAME);
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_ID, nestedProxyResource.id());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_NAME, nestedProxyResource.name());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_TYPE, nestedProxyResource.type());
        Assertions.assertNotNull(nestedProxyResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, nestedProxyResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, nestedProxyResource.properties().provisioningState());

        // NestedProxyResources.update
        nestedProxyResource.update()
            .withProperties(new NestedProxyResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID2))
            .apply();
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_ID, nestedProxyResource.id());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_NAME, nestedProxyResource.name());
        Assertions.assertEquals(NESTED_PROXY_RESOURCE_TYPE, nestedProxyResource.type());
        Assertions.assertNotNull(nestedProxyResource.properties());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, nestedProxyResource.properties().description());
        Assertions.assertEquals(RESOURCE_PROVISIONING_STATE, nestedProxyResource.properties().provisioningState());

        // NestedProxyResources.delete
        manager.nesteds().delete(RESOURCE_GROUP_NAME, TOP_LEVEL_TRACKED_RESOURCE_NAME, NESTED_PROXY_RESOURCE_NAME);
    }

    @Test
    public void testSingletonResource() {
        final String resourceNameDefault = "default";

        SingletonTrackedResource resource = manager.singletons()
            .createOrUpdate(RESOURCE_GROUP_NAME,
                new SingletonTrackedResourceInner().withLocation(TOP_LEVEL_TRACKED_RESOURCE_REGION.name())
                    .withProperties(
                        new SingletonTrackedResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID)));
        Assertions.assertEquals(resourceNameDefault, resource.name());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID, resource.properties().description());

        resource = manager.singletons()
            // TODO location should not be in PATCH
            .update(RESOURCE_GROUP_NAME, new SingletonTrackedResourceInner().withLocation(Region.US_EAST2.name())
                .withProperties(new SingletonTrackedResourceProperties().withDescription(RESOURCE_DESCRIPTION_VALID2)));
        Assertions.assertEquals(resourceNameDefault, resource.name());
        Assertions.assertEquals(RESOURCE_DESCRIPTION_VALID2, resource.properties().description());

        resource = manager.singletons().getByResourceGroup(RESOURCE_GROUP_NAME);
        Assertions.assertEquals(resourceNameDefault, resource.name());

        resource = manager.singletons().listByResourceGroup(RESOURCE_GROUP_NAME).stream().findFirst().get();
        Assertions.assertEquals(resourceNameDefault, resource.name());
    }
}
