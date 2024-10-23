// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.array;

import static org.junit.jupiter.api.Assertions.assertIterableEquals;

import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;

public class NullableBooleanValueClientTest {

    private final NullableBooleanValueClient client = new ArrayClientBuilder().buildNullableBooleanValueClient();

    @Test
    public void get() {
        List<Boolean> response = client.get();
        assertIterableEquals(Arrays.asList(true, null, false), response);
    }

    @Test
    public void put() {
        List<Boolean> body = Arrays.asList(true, null, false);
        client.put(body);
    }
}
