// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package tsptest.armversioned;

import com.azure.core.util.Context;
import org.mockito.Mockito;
import tsptest.armversioned.fluent.models.TopLevelArmResourceInner;

public class ArmVersionedTests {

    // only to test compilation
    public void testVersionedApi() {
        ArmVersionedManager manager = Mockito.mock(ArmVersionedManager.class);
        TopLevelArmResourceInner resource = Mockito.mock(TopLevelArmResourceInner.class);

        // API without optional parameter
        // this API exists in all versions
        manager.serviceClient().getTopLevelArmResources().createOrUpdate("resourceGroup", "resourceName", resource);
        manager.topLevelArmResources().list();
        manager.topLevelArmResources().action("resourceGroup", "resourceName");

        // API in 2024-12-01
        manager.serviceClient()
            .getTopLevelArmResources()
            .createOrUpdate("resourceGroup", "resourceName", resource, "parameter", "newParameter", Context.NONE);
        manager.topLevelArmResources().list("parameter", "newParameter", Context.NONE);
        manager.topLevelArmResources()
            .actionWithResponse("resourceGroup", "resourceName", "parameter", "newParameter", Context.NONE);

        // API in 2023-12-01
        // this op will be generated, if tspconfig has "advanced-versioning" option
        // REST API allow adding optional parameter to operation
        manager.serviceClient()
            .getTopLevelArmResources()
            .createOrUpdate("resourceGroup", "resourceName", resource, "parameter", Context.NONE);
        manager.topLevelArmResources().list("parameter", Context.NONE);
        manager.topLevelArmResources().actionWithResponse("resourceGroup", "resourceName", "parameter", Context.NONE);
    }
}
