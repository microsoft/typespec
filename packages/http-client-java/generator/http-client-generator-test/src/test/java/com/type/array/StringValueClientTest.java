// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.array;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

class StringValueClientTest {

    StringValueClient client = new ArrayClientBuilder().buildStringValueClient();

    @Test
    void get() {
        List<String> response = client.get();
        Assertions.assertEquals(2, response.size());
        Assertions.assertEquals("hello", response.get(0));
        Assertions.assertEquals("", response.get(1));
    }

    @Test
    void put() {
        client.put(Arrays.asList("hello", ""));
    }
}