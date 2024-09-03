// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.valuetypes;

import org.junit.jupiter.api.Test;

public class EnumValueTests {

    private final UnionEnumValueClient client = new ValueTypesClientBuilder().buildUnionEnumValueClient();

    @Test
    public void test() {
       client.put(client.get());
    }
}
