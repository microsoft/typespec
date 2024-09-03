// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.resourcemanager.models.commontypes.managedidentity;

import com.azure.core.management.Region;
import com.azure.resourcemanager.models.commontypes.managedidentity.models.ManagedIdentityTrackedResource;
import com.azure.resourcemanager.models.commontypes.managedidentity.models.ManagedIdentityTrackedResourceProperties;
import com.azure.resourcemanager.models.commontypes.managedidentity.models.ManagedServiceIdentity;
import com.azure.resourcemanager.models.commontypes.managedidentity.models.ManagedServiceIdentityType;
import com.azure.resourcemanager.models.commontypes.managedidentity.models.UserAssignedIdentity;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;

import java.util.HashMap;
import java.util.Map;

public class ManagedIdentityManagerTests {
    private static final String USER_ASSIGNED_IDENTITIES_KEY = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id1";
    private final ManagedIdentityManager manager = ManagedIdentityManager.authenticate(
            ArmUtils.createTestHttpPipeline(),
            ArmUtils.getAzureProfile());

    @Test
    public void testManagedIdentityManager() {
        Map<String, String> tagsMap = new HashMap<>();
        tagsMap.put("tagKey1", "tagValue1");
        ManagedIdentityTrackedResource resource = manager.managedIdentityTrackedResources()
                .define("identity")
                .withRegion(Region.US_EAST)
                .withExistingResourceGroup("test-rg")
                .withProperties(new ManagedIdentityTrackedResourceProperties())
                .withIdentity(new ManagedServiceIdentity().withType(ManagedServiceIdentityType.SYSTEM_ASSIGNED))
                .withTags(tagsMap)
                .create();
        Assertions.assertEquals(ManagedServiceIdentityType.SYSTEM_ASSIGNED, resource.identity().type());
        Assertions.assertNotNull(resource.identity().principalId());
        Assertions.assertNotNull(resource.identity().tenantId());

        resource = manager.managedIdentityTrackedResources().getById(resource.id());
        Assertions.assertEquals(ManagedServiceIdentityType.SYSTEM_ASSIGNED, resource.identity().type());
        Assertions.assertNotNull(resource.identity().principalId());
        Assertions.assertNotNull(resource.identity().tenantId());

        Map<String, UserAssignedIdentity> userAssignedIdentityMap = new HashMap<>();
        userAssignedIdentityMap.put(USER_ASSIGNED_IDENTITIES_KEY, new UserAssignedIdentity());
        resource.update().withIdentity(new ManagedServiceIdentity()
                        .withType(ManagedServiceIdentityType.SYSTEM_ASSIGNED_USER_ASSIGNED)
                        .withUserAssignedIdentities(userAssignedIdentityMap))
                .apply();
        Assertions.assertEquals(ManagedServiceIdentityType.SYSTEM_ASSIGNED_USER_ASSIGNED, resource.identity().type());
        Assertions.assertNotNull(resource.identity().principalId());
        Assertions.assertNotNull(resource.identity().tenantId());
        Assertions.assertNotNull(resource.identity().userAssignedIdentities());
        Assertions.assertEquals(1, resource.identity().userAssignedIdentities().size());
        UserAssignedIdentity userAssignedIdentity = resource.identity()
                .userAssignedIdentities().get(USER_ASSIGNED_IDENTITIES_KEY);
        Assertions.assertNotNull(userAssignedIdentity.principalId());
        Assertions.assertNotNull(userAssignedIdentity.clientId());

    }
}
