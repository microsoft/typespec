// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.resourcemanager.multiservice;

import azure.resourcemanager.multiservice.combined.CombinedManager;
import azure.resourcemanager.multiservice.combined.models.DiskProperties;
import azure.resourcemanager.multiservice.combined.models.VirtualMachineProperties;
import com.azure.core.management.Region;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;

public final class ArmMultipleServiceTests {

    private final CombinedManager manager
        = CombinedManager.authenticate(ArmUtils.createTestHttpPipeline(), ArmUtils.getAzureProfile());

    private static final String RESOURCE_GROUP_NAME = "test-rg";
    private static final Region REGION = Region.US_EAST;

    @Test
    public void testCombinedClient() {
        manager.disks()
            .define("disk1")
            .withRegion(REGION)
            .withExistingResourceGroup(RESOURCE_GROUP_NAME)
            .withProperties(new DiskProperties())
            .create();
        manager.disks().getByResourceGroup(RESOURCE_GROUP_NAME, "disk1");

        manager.virtualMachines()
            .define("vm1")
            .withRegion(REGION)
            .withExistingResourceGroup(RESOURCE_GROUP_NAME)
            .withProperties(new VirtualMachineProperties())
            .create();
        manager.virtualMachines().getByResourceGroup(RESOURCE_GROUP_NAME, "vm1");
    }
}
