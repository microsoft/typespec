// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.array;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

class Int32ValueClientTest {

    Int32ValueClient client = new ArrayClientBuilder().buildInt32ValueClient();

    @Test
    void get() {
        List<Integer> response = client.get();
        Assertions.assertEquals(2, response.size());
        Assertions.assertEquals(1, response.get(0));
        Assertions.assertEquals(2, response.get(1));

    }

    @Test
    void put() {
        client.put(Arrays.asList(1, 2));
    }
}