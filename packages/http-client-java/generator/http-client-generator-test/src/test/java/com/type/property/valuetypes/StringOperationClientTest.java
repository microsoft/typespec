// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.valuetypes;

import com.type.property.valuetypes.models.StringProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class StringOperationClientTest {

    StringOperationClient client = new ValueTypesClientBuilder().buildStringOperationClient();

    @Test
    void get() {
        StringProperty stringProperty = client.get();
        Assertions.assertEquals("hello", stringProperty.getProperty());
    }

    @Test
    void put() {
        StringProperty stringProperty = new StringProperty("hello");
        client.put(stringProperty);
    }
}