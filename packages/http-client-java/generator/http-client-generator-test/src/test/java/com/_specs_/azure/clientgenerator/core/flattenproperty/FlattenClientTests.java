// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com._specs_.azure.clientgenerator.core.flattenproperty;

import com._specs_.azure.clientgenerator.core.flattenproperty.models.ChildFlattenModel;
import com._specs_.azure.clientgenerator.core.flattenproperty.models.ChildModel;
import com._specs_.azure.clientgenerator.core.flattenproperty.models.FlattenModel;
import com._specs_.azure.clientgenerator.core.flattenproperty.models.NestedFlattenModel;
import org.junit.jupiter.api.Test;

public class FlattenClientTests {
    private final FlattenPropertyClient flattenClient = new FlattenPropertyClientBuilder().buildClient();

    @Test
    public void testFlattenModel() {
        // flatten is not enabled for data-plane
        flattenClient.putFlattenModel(new FlattenModel("foo", new ChildModel("bar", 10)));
        flattenClient.putNestedFlattenModel(new NestedFlattenModel("foo", new ChildFlattenModel("bar", new ChildModel("test",10))));
    }
}
