// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.armversioned;

import com.azure.core.management.Region;
import com.azure.core.util.Context;
import org.mockito.Mockito;
import tsptest.armversioned.fluent.models.TopLevelArmResourceInner;
import tsptest.armversioned.models.TopLevelArmResource;

public class ArmVersionedTests {

    // only to test compilation
    public void testVersionedApi() {
        ArmVersionedManager manager = Mockito.mock(ArmVersionedManager.class);
        TopLevelArmResourceInner resourceInner = Mockito.mock(TopLevelArmResourceInner.class);

        // API without optional parameter
        // this API exists in all versions
        manager.topLevelArmResources().list();

        manager.topLevelArmResources().listByResourceGroup("resourceGroup");

        manager.topLevelArmResources().action("resourceGroup", "resourceName");

        manager.serviceClient()
            .getTopLevelArmResources()
            .createOrUpdate("resourceGroup", "resourceName", resourceInner);
        TopLevelArmResource resource = manager.topLevelArmResources()
            .define("resourceName")
            .withRegion(Region.US_WEST3)
            .withExistingResourceGroup("resourceGroup")
            .create();

        resource.update().apply();

        manager.topLevelArmResources().delete("resourceGroup", "resourceName");
        manager.topLevelArmResources().deleteById("id");

        resource.refresh();

        // API in 2024-12-01
        manager.topLevelArmResources().list("parameter", "newParameter", Context.NONE);

        manager.topLevelArmResources().listByResourceGroup("resourceGroup", "parameter", "newParameter", Context.NONE);

        manager.topLevelArmResources()
            .actionWithResponse("resourceGroup", "resourceName", "parameter", "newParameter", Context.NONE);

        manager.serviceClient()
            .getTopLevelArmResources()
            .createOrUpdate("resourceGroup", "resourceName", resourceInner, "parameter", "newParameter", Context.NONE);
        manager.topLevelArmResources()
            .define("resourceName")
            .withRegion(Region.US_WEST3)
            .withExistingResourceGroup("resourceGroup")
            .withParameter("parameter")
            .withNewParameter("newParameter")
            .create();

        resource.update().withParameter("parameter").withNewParameter("newParameter").apply();

        manager.topLevelArmResources()
            .deleteWithResponse("resourceGroup", "resourceName", "parameter", "newParameter", Context.NONE);
        manager.topLevelArmResources().deleteByIdWithResponse("id", "parameter", "newParameter", Context.NONE);

        // API in 2023-12-01
        // this op will be generated, if tspconfig has "advanced-versioning" option
        // REST API allow adding optional parameter to operation
        manager.topLevelArmResources().list("parameter", Context.NONE);

        manager.topLevelArmResources().listByResourceGroup("resourceGroup", "parameter", Context.NONE);

        manager.topLevelArmResources().actionWithResponse("resourceGroup", "resourceName", "parameter", Context.NONE);

        manager.serviceClient()
            .getTopLevelArmResources()
            .createOrUpdate("resourceGroup", "resourceName", resourceInner, "parameter", Context.NONE);
        manager.topLevelArmResources()
            .define("resourceName")
            .withRegion(Region.US_WEST3)
            .withExistingResourceGroup("resourceGroup")
            .withParameter("parameter")
            .create();

        resource.update().withParameter("parameter").apply();

        manager.topLevelArmResources().deleteWithResponse("resourceGroup", "resourceName", "parameter", Context.NONE);
        manager.topLevelArmResources().deleteByIdWithResponse("id", "parameter", Context.NONE);
    }
}
