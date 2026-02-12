// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.resourcemanager.methodsubscriptionid;

import azure.resourcemanager.methodsubscriptionid.fluent.models.SubscriptionResource1Inner;
import azure.resourcemanager.methodsubscriptionid.fluent.models.SubscriptionResource2Inner;
import azure.resourcemanager.methodsubscriptionid.fluent.models.SubscriptionResourceInner;
import azure.resourcemanager.methodsubscriptionid.models.ResourceGroupResource;
import azure.resourcemanager.methodsubscriptionid.models.ResourceGroupResourceProperties;
import azure.resourcemanager.methodsubscriptionid.models.SubscriptionResource;
import azure.resourcemanager.methodsubscriptionid.models.SubscriptionResource1;
import azure.resourcemanager.methodsubscriptionid.models.SubscriptionResource1Properties;
import azure.resourcemanager.methodsubscriptionid.models.SubscriptionResource2;
import azure.resourcemanager.methodsubscriptionid.models.SubscriptionResource2Properties;
import azure.resourcemanager.methodsubscriptionid.models.SubscriptionResourceProperties;
import com.azure.core.management.Region;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;

/**
 * Test for ARM method level subscription ID parameter placement.
 * 
 * This test validates that subscriptionId parameters are correctly placed at method level
 * vs client level based on @clientLocation decorators in TypeSpec specifications.
 * 
 * Key scenarios tested:
 * 1. TwoSubscriptionResourcesMethodLevel: Both subscription resources have subscriptionId as method parameter
 * 2. MixedSubscriptionPlacement: Subscription resource has method-level subscriptionId,
 * resource group resource uses client-level subscriptionId
 */
public class MethodSubscriptionIdTest {
    // Test subscription ID - this will be passed as method parameter for subscription resources
    private static final String TEST_SUBSCRIPTION_ID = "00000000-0000-0000-0000-000000000000";

    // Resource names
    private static final String SUBSCRIPTION_RESOURCE_1_NAME = "sub-resource-1";
    private static final String SUBSCRIPTION_RESOURCE_2_NAME = "sub-resource-2";
    private static final String SUBSCRIPTION_RESOURCE_NAME = "sub-resource";
    private static final String RESOURCE_GROUP_RESOURCE_NAME = "rg-resource";
    private static final String RESOURCE_GROUP_NAME = "test-rg";

    private final MethodSubscriptionIdManager manager
        = MethodSubscriptionIdManager.authenticate(ArmUtils.createTestHttpPipeline(), ArmUtils.getAzureProfile());

    @Test
    public void testTwoSubscriptionResourcesMethodLevelSubscriptionResource1Operations() {
        // Test Scenario 1: Two subscription resources with method-level subscriptionId
        // SubscriptionResource1 operations should require subscriptionId as method parameter

        // The key test: verify that get operation requires subscriptionId as method parameter
        // This validates that @clientLocation decorator moved subscriptionId to method level
        SubscriptionResource1 resource = manager.twoSubscriptionResourcesMethodLevelSubscriptionResource1Operations()
            .get(TEST_SUBSCRIPTION_ID, SUBSCRIPTION_RESOURCE_1_NAME);

        // Verify the resource structure
        Assertions.assertNotNull(resource);
        Assertions.assertNotNull(resource.name());
        Assertions.assertNotNull(resource.type());

        // Test delete operation also requires subscriptionId as method parameter
        manager.twoSubscriptionResourcesMethodLevelSubscriptionResource1Operations()
            .deleteByResourceGroup(TEST_SUBSCRIPTION_ID, SUBSCRIPTION_RESOURCE_1_NAME);

        // TODO: resource define does not take subscriptionId parameter - this is a bug in codegen
        // Verify PUT
        manager.serviceClient()
            .getTwoSubscriptionResourcesMethodLevelSubscriptionResource1Operations()
            .put(TEST_SUBSCRIPTION_ID, SUBSCRIPTION_RESOURCE_1_NAME, new SubscriptionResource1Inner().withProperties(
                new SubscriptionResource1Properties().withDescription("Valid subscription resource 1")));
    }

    @Test
    public void testTwoSubscriptionResourcesMethodLevelSubscriptionResource2Operations() {
        // Test Scenario 1: Two subscription resources with method-level subscriptionId
        // SubscriptionResource2 operations should require subscriptionId as method parameter

        SubscriptionResource2 resource = manager.twoSubscriptionResourcesMethodLevelSubscriptionResource2Operations()
            .get(TEST_SUBSCRIPTION_ID, SUBSCRIPTION_RESOURCE_2_NAME);

        Assertions.assertNotNull(resource);
        Assertions.assertNotNull(resource.name());
        Assertions.assertNotNull(resource.type());

        manager.twoSubscriptionResourcesMethodLevelSubscriptionResource2Operations()
            .deleteByResourceGroup(TEST_SUBSCRIPTION_ID, SUBSCRIPTION_RESOURCE_2_NAME);

        // TODO: resource define does not take subscriptionId parameter - this is a bug in codegen
        // Verify PUT
        manager.serviceClient()
            .getTwoSubscriptionResourcesMethodLevelSubscriptionResource2Operations()
            .put(TEST_SUBSCRIPTION_ID, SUBSCRIPTION_RESOURCE_2_NAME, new SubscriptionResource2Inner()
                .withProperties(new SubscriptionResource2Properties().withConfigValue("test-config")));
    }

    @Test
    public void testMixedSubscriptionPlacementSubscriptionResourceOperations() {
        // Test Scenario 2: Mixed placement - subscription resource with method-level subscriptionId

        SubscriptionResource resource = manager.mixedSubscriptionPlacementSubscriptionResourceOperations()
            .get(TEST_SUBSCRIPTION_ID, SUBSCRIPTION_RESOURCE_NAME);

        Assertions.assertNotNull(resource);
        Assertions.assertNotNull(resource.name());
        Assertions.assertNotNull(resource.type());

        manager.mixedSubscriptionPlacementSubscriptionResourceOperations()
            .deleteByResourceGroup(TEST_SUBSCRIPTION_ID, SUBSCRIPTION_RESOURCE_NAME);

        // TODO: resource define does not take subscriptionId parameter - this is a bug in codegen
        // Verify PUT
        manager.serviceClient()
            .getMixedSubscriptionPlacementSubscriptionResourceOperations()
            .put(TEST_SUBSCRIPTION_ID, RESOURCE_GROUP_RESOURCE_NAME, new SubscriptionResourceInner()
                .withProperties(new SubscriptionResourceProperties().withSubscriptionSetting("test-sub-setting")));
    }

    @Test
    public void testMixedSubscriptionPlacementResourceGroupResourceOperations() {
        // Test Scenario 2: Mixed placement - resource group resource with client-level subscriptionId
        // This resource should NOT require subscriptionId as method parameter (uses client-level)

        // Key test: getByResourceGroup does NOT take subscriptionId parameter
        // The subscriptionId comes from the client-level (manager configuration)
        ResourceGroupResource resource = manager.mixedSubscriptionPlacementResourceGroupResourceOperations()
            .getByResourceGroup(RESOURCE_GROUP_NAME, RESOURCE_GROUP_RESOURCE_NAME);

        Assertions.assertNotNull(resource);
        Assertions.assertNotNull(resource.name());
        Assertions.assertNotNull(resource.type());
        Assertions.assertNotNull(resource.region());

        // Key test: deleteByResourceGroup does NOT take subscriptionId parameter
        manager.mixedSubscriptionPlacementResourceGroupResourceOperations()
            .deleteByResourceGroup(RESOURCE_GROUP_NAME, RESOURCE_GROUP_RESOURCE_NAME);

        // Verify PUT
        manager.mixedSubscriptionPlacementResourceGroupResourceOperations()
            .define(RESOURCE_GROUP_RESOURCE_NAME)
            .withRegion(Region.US_EAST)
            .withExistingResourceGroup(RESOURCE_GROUP_NAME)
            .withProperties(new ResourceGroupResourceProperties().withResourceGroupSetting("test-setting"))
            .create();
    }
}
