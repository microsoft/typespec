// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.optional;

import com.type.property.optional.models.BytesProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class BytesClientTest {

    BytesClient bytesClient = new OptionalClientBuilder().buildBytesClient();

    @Test
    void getAll() {
        BytesProperty bytesProperty = bytesClient.getAll();
        Assertions.assertNotNull(bytesProperty.getProperty());
    }

    @Test
    void putAll() {
        BytesProperty bytesProperty = new BytesProperty();
        bytesProperty.setProperty(new byte[]{104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33});
        bytesClient.putAll(bytesProperty);
    }


    @Test
    void getDefault() {
        BytesProperty bytesProperty = bytesClient.getDefault();
        Assertions.assertNull(bytesProperty.getProperty());
    }

    @Test
    void putDefault() {
        BytesProperty bytesProperty = new BytesProperty();
        bytesClient.putDefault(bytesProperty);
    }
}