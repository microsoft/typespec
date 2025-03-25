// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.resourcemanager.nonresource;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.utils.ArmUtils;

public final class NonResourceTests {

    private final NonResourceManager manager
        = NonResourceManager.authenticate(ArmUtils.createTestHttpPipeline(), ArmUtils.getAzureProfile());

    @Test
    public void testNonResourceGet() {
        manager.nonResourceOperations().get("eastus", "hello");
    }

    @Disabled("It is mistakenly treated as a resource")
    @Test
    public void testNonResourcePut() {
        manager.nonResourceOperations()
            .define("hello")
            .withExistingLocation("eastus")
            .withName("hello")
            .withType("nonResource")
            .create();
    }
}
