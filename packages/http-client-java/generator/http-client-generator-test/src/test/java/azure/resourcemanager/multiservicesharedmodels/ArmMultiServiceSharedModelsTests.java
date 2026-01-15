// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.resourcemanager.multiservicesharedmodels;

import azure.resourcemanager.multiservicesharedmodels.combined.CombinedManager;
import azure.resourcemanager.multiservicesharedmodels.combined.models.SharedMetadata;
import azure.resourcemanager.multiservicesharedmodels.combined.models.StorageAccountProperties;
import azure.resourcemanager.multiservicesharedmodels.combined.models.VirtualMachineProperties;
import com.azure.core.management.Region;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;

public final class ArmMultiServiceSharedModelsTests {

    private final CombinedManager manager
        = CombinedManager.authenticate(ArmUtils.createTestHttpPipeline(), ArmUtils.getAzureProfile());

    private static final String RESOURCE_GROUP_NAME = "test-rg";
    private static final Region REGION_STORAGE = Region.US_WEST;
    private static final Region REGION_VM = Region.US_EAST;

    @Test
    @Disabled("route in code is wrong: /Microsoft.Compute/storageAccounts/account1")
    public void testCombinedClient() {
        Map<String, String> storageTags = new HashMap<>();
        storageTags.put("department", "engineering");
        SharedMetadata storageMetadata = new SharedMetadata().withCreatedBy("admin@example.com").withTags(storageTags);

        manager.storageAccounts()
            .define("account1")
            .withRegion(REGION_STORAGE)
            .withExistingResourceGroup(RESOURCE_GROUP_NAME)
            .withProperties(new StorageAccountProperties().withMetadata(storageMetadata))
            .create();
        manager.storageAccounts().getByResourceGroup(RESOURCE_GROUP_NAME, "account1");

        Map<String, String> vmTags = new HashMap<>();
        vmTags.put("environment", "production");
        SharedMetadata vmMetadata = new SharedMetadata().withCreatedBy("user@example.com").withTags(vmTags);

        manager.virtualMachines()
            .define("vm-shared1")
            .withRegion(REGION_VM)
            .withExistingResourceGroup(RESOURCE_GROUP_NAME)
            .withProperties(new VirtualMachineProperties().withMetadata(vmMetadata))
            .create();
        manager.virtualMachines().getByResourceGroup(RESOURCE_GROUP_NAME, "vm-shared1");
    }
}
