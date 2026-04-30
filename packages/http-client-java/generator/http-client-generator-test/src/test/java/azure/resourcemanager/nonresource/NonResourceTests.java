// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.resourcemanager.nonresource;

import azure.resourcemanager.nonresource.fluent.models.NonResourceInner;
import org.junit.jupiter.api.Assertions;
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

    @Test
    public void testNonResourceCreate() {
        NonResourceInner body = new NonResourceInner().withId("id").withName("hello").withType("nonResource");
        NonResourceInner result = manager.serviceClient().getNonResourceOperations().create("eastus", "hello", body);
        Assertions.assertEquals("id", result.id());
        Assertions.assertEquals("hello", result.name());
        Assertions.assertEquals("nonResource", result.type());
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
