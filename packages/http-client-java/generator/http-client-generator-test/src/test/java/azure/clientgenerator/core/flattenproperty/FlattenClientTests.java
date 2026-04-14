// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.flattenproperty;

import azure.clientgenerator.core.flattenproperty.models.ChildFlattenModel;
import azure.clientgenerator.core.flattenproperty.models.ChildModel;
import azure.clientgenerator.core.flattenproperty.models.FlattenModel;
import azure.clientgenerator.core.flattenproperty.models.FlattenUnknownModel;
import azure.clientgenerator.core.flattenproperty.models.NestedFlattenModel;
import azure.clientgenerator.core.flattenproperty.models.Solution;
import azure.clientgenerator.core.flattenproperty.models.SolutionProperties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class FlattenClientTests {
    private final FlattenPropertyClient flattenClient = new FlattenPropertyClientBuilder().buildClient();

    @Test
    public void testFlattenModel() {
        // flatten is not enabled for data-plane
        flattenClient.putFlattenModel(new FlattenModel("foo", new ChildModel("bar", 10)));
        flattenClient.putNestedFlattenModel(
            new NestedFlattenModel("foo", new ChildFlattenModel("bar", new ChildModel("test", 10))));
    }

    @Test
    public void testPutFlattenUnknownModel() {
        // flatten is ignored for unknown (non-model) type properties
        FlattenUnknownModel result = flattenClient.putFlattenUnknownModel(new FlattenUnknownModel("foo"));
        Assertions.assertEquals("test", result.getName());
        Assertions.assertNotNull(result.getProperties());
    }

    @Test
    public void testPutFlattenReadOnlyModel() {
        // flatten with all read-only properties; input only contains writable fields
        Solution result = flattenClient.putFlattenReadOnlyModel(new Solution("foo"));
        Assertions.assertEquals("foo", result.getName());
        SolutionProperties properties = result.getProperties();
        Assertions.assertNotNull(properties);
        Assertions.assertEquals("solution1", properties.getSolutionId());
        Assertions.assertEquals("Solution Title", properties.getTitle());
        Assertions.assertEquals("Solution Content", properties.getContent());
    }
}
