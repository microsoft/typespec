// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.array;

import static org.junit.jupiter.api.Assertions.assertIterableEquals;

import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;

public class NullableInt32ValueClientTest {

    private final NullableInt32ValueClient client = new ArrayClientBuilder().buildNullableInt32ValueClient();

    @Test
    public void get() {
        List<Integer> response = client.get();
        assertIterableEquals(Arrays.asList(1, null, 3), response);
    }

    @Test
    public void put() {
        List<Integer> body = Arrays.asList(1, null, 3);
        client.put(body);
    }
}
