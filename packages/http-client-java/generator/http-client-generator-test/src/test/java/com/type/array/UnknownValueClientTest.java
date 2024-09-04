// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.array;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

class UnknownValueClientTest {

    UnknownValueClient client = new ArrayClientBuilder().buildUnknownValueClient();

    @Test
    void get() {
        List<Object> response = client.get();
        Assertions.assertEquals(3, response.size());
        Assertions.assertEquals(1, response.get(0));
        Assertions.assertEquals("hello", response.get(1));
        Assertions.assertEquals(null, response.get(2));
    }

    @Test
    void put() {
        client.put(Arrays.asList(1, "hello", null));
    }
}