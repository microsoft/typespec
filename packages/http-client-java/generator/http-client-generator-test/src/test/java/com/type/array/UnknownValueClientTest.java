// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.array;

import java.util.Arrays;
import java.util.List;

import com.azure.core.util.BinaryData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

class UnknownValueClientTest {

    UnknownValueClient client = new ArrayClientBuilder().buildUnknownValueClient();

    @Disabled("TODO https://github.com/Azure/autorest.java/issues/2964")
    @Test
    void get() {
        List<BinaryData> response = client.get();
        Assertions.assertEquals(3, response.size());
        Assertions.assertEquals(1, response.get(0).toObject(Integer.class));
        Assertions.assertEquals("hello", response.get(1).toObject(String.class));
        Assertions.assertEquals(null, response.get(2));
    }

    @Test
    void put() {
        client.put(Arrays.asList(
          BinaryData.fromObject(1),
          BinaryData.fromObject("hello"), null));
    }
}
