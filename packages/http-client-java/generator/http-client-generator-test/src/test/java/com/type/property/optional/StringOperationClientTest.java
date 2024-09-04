// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.optional;

import com.type.property.optional.models.StringProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class StringOperationClientTest {

    StringOperationClient client = new OptionalClientBuilder().buildStringOperationClient();

    @Test
    void getAll() {
        StringProperty stringProperty = client.getAll();
        Assertions.assertEquals("hello", stringProperty.getProperty());
    }

    @Test
    void getDefault() {
        StringProperty stringProperty = client.getDefault();
        Assertions.assertNull(stringProperty.getProperty());
    }

    @Test
    void putAll() {
        StringProperty stringProperty = new StringProperty();
        stringProperty.setProperty("hello");
        client.putAll(stringProperty);
    }

    @Test
    void putDefault() {
        StringProperty stringProperty = new StringProperty();
        client.putDefault(stringProperty);
    }
}