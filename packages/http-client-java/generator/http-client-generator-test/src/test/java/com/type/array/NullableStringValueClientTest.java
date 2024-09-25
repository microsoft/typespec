// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.array;

import static org.junit.jupiter.api.Assertions.assertIterableEquals;

import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;

public class NullableStringValueClientTest {

    private final NullableStringValueClient client = new ArrayClientBuilder().buildNullableStringValueClient();

    @Test
    public void get() {
        List<String> response = client.get();
        assertIterableEquals(Arrays.asList("hello", null, "world"), response);
    }

    @Test
    public void put() {
        List<String> body = Arrays.asList("hello", null, "world");
        client.put(body);
    }
}
