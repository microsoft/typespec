// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.array;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

class BooleanValueClientTest {

    BooleanValueClient client = new ArrayClientBuilder().buildBooleanValueClient();

    @Test
    void get() {
        List<Boolean> response = client.get();
        Assertions.assertEquals(2, response.size());
        Assertions.assertEquals(true, response.get(0));
        Assertions.assertEquals(false, response.get(1));
    }

    @Test
    void put() {
        List<Boolean> body = Arrays.asList(true, false);
        client.put(body);
    }
}