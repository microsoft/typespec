// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.resourcemanager.multiserviceolderversions;

import azure.resourcemanager.multiserviceolderversions.combined.CombinedManager;
import azure.resourcemanager.multiserviceolderversions.combined.models.DiskProperties;
import azure.resourcemanager.multiserviceolderversions.combined.models.VirtualMachineProperties;
import com.azure.core.management.Region;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;

public final class ArmMultiServiceOlderVersionsTests {

    private final CombinedManager manager
        = CombinedManager.authenticate(ArmUtils.createTestHttpPipeline(), ArmUtils.getAzureProfile());

    private static final String RESOURCE_GROUP_NAME = "test-rg";
    private static final Region REGION = Region.US_EAST;

    @Test
    public void testCombinedClient() {
        manager.disks()
            .define("disk-old1")
            .withRegion(REGION)
            .withExistingResourceGroup(RESOURCE_GROUP_NAME)
            .withProperties(new DiskProperties().withDiskSizeGB(128))
            .create();
        manager.disks().getByResourceGroup(RESOURCE_GROUP_NAME, "disk-old1");

        manager.virtualMachines()
            .define("vm-old1")
            .withRegion(REGION)
            .withExistingResourceGroup(RESOURCE_GROUP_NAME)
            .withProperties(new VirtualMachineProperties().withSize("Standard_D2s_v3"))
            .create();
        manager.virtualMachines().getByResourceGroup(RESOURCE_GROUP_NAME, "vm-old1");
    }
}
