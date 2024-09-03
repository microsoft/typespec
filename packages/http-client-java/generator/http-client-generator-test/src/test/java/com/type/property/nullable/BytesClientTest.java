// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.nullable;

import com.type.property.nullable.models.BytesProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.io.IOException;

class BytesClientTest {

    BytesClient client = new NullableClientBuilder().buildBytesClient();

    @Test
    void patchNonNullWithResponse() {
        byte[] input = new byte[]{104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33};
        BytesProperty bytesProperty = new BytesProperty().setRequiredProperty("foo").setNullableProperty(input);
        client.patchNonNull(bytesProperty);
    }

    @Test
    void patchNullWithResponse() {
        client.patchNull(new BytesProperty().setRequiredProperty("foo").setNullableProperty(null));
    }

    @Test
    void getNonNull() {
        BytesProperty response = client.getNonNull();
        Assertions.assertNotNull(response.getNullableProperty());
    }

    @Test
    void getNull() {
        BytesProperty response = client.getNull();
        Assertions.assertNull(response.getNullableProperty());
    }
}