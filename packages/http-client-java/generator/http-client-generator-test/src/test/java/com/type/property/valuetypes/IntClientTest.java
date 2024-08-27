// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.valuetypes;

import com.type.property.valuetypes.models.IntProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class IntClientTest {

    IntClient client = new ValueTypesClientBuilder().buildIntClient();

    @Test
    void get() {
        IntProperty intProperty = client.get();
        Assertions.assertEquals(42, intProperty.getProperty());
    }

    @Test
    void put() {
        IntProperty intProperty = new IntProperty(42);
        client.put(intProperty);
    }
}