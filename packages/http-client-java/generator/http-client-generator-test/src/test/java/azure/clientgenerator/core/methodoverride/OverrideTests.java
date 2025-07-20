// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package azure.clientgenerator.core.methodoverride;

import azure.clientgenerator.core.methodoverride.models.GroupParametersOptions;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * Test scenarios for client override behavior.
 * 
 * These tests verify that @override decorator works correctly for:
 * 1. Reordering parameters in method signatures
 * 2. Grouping parameters into options models
 */
public class OverrideTests {

    private final ReorderParametersClient reorderParametersClient
        = new OverrideClientBuilder().buildReorderParametersClient();

    private final GroupParametersClient groupParametersClient
        = new OverrideClientBuilder().buildGroupParametersClient();

    @Test
    public void testReorderParameters() {
        // Verify that after @override the parameters are reordered correctly
        // in the client method signature.
        //
        // Original operation: reorder(@path param2: string, @path param1: string)
        // After @override: reorder(@path param1: string, @path param2: string)
        //
        // Expected path parameter:
        // param1: param1
        // param2: param2
        // Expected response: 204 No Content

        reorderParametersClient.reorder("param1", "param2");
    }

    @Test
    public void testGroupParameters() {
        // Verify that after @override the parameters are grouped correctly
        // to GroupParametersOptions in the client method signature.
        //
        // Original operation: group(@query param1: string, @query param2: string)
        // After @override: group(options: GroupParametersOptions)
        //
        // Expected query parameter:
        // param1: param1
        // param2: param2
        // Expected response: 204 No Content

        GroupParametersOptions options = new GroupParametersOptions("param1", "param2");
        groupParametersClient.group(options);
    }

    @Test
    public void testGroupParametersOptionsModel() {
        // Verify the GroupParametersOptions model structure and functionality
        GroupParametersOptions options = new GroupParametersOptions("value1", "value2");

        // Verify the parameters are accessible through getters
        Assertions.assertEquals("value1", options.getParam1());
        Assertions.assertEquals("value2", options.getParam2());
    }
}
