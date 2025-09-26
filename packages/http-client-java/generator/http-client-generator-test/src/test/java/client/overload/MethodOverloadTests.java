// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package client.overload;

import client.overload.models.Resource;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * Test for overload operation in Java.
 * 
 * This test validates method overloading capabilities where:
 * - list() operation lists all resources
 * - listByScope(String scope) operation lists resources filtered by scope
 */
public final class MethodOverloadTests {

    private final OverloadClient client = new OverloadClientBuilder().buildClient();

    @Test
    void testList() {
        // Test the list operation that returns all resources
        // Expected response: [{"id": "1", "name": "foo", "scope": "car"}, {"id": "2", "name": "bar", "scope": "bike"}]
        List<Resource> resources = client.list();

        Assertions.assertNotNull(resources);
        Assertions.assertEquals(2, resources.size());

        // Verify first resource
        Resource resource1 = resources.get(0);
        Assertions.assertEquals("1", resource1.getId());
        Assertions.assertEquals("foo", resource1.getName());
        Assertions.assertEquals("car", resource1.getScope());

        // Verify second resource
        Resource resource2 = resources.get(1);
        Assertions.assertEquals("2", resource2.getId());
        Assertions.assertEquals("bar", resource2.getName());
        Assertions.assertEquals("bike", resource2.getScope());
    }

    @Test
    void testListByScope() {
        // Test the listByScope operation that returns resources filtered by scope "car"
        // Expected response: [{"id": "1", "name": "foo", "scope": "car"}]
        String scope = "car";
        List<Resource> resources = client.listByScope(scope);

        Assertions.assertNotNull(resources);
        Assertions.assertEquals(1, resources.size());

        // Verify the filtered resource
        Resource resource = resources.get(0);
        Assertions.assertEquals("1", resource.getId());
        Assertions.assertEquals("foo", resource.getName());
        Assertions.assertEquals("car", resource.getScope());
    }
}
