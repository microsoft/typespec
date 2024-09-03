// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.array;

import com.type.array.models.InnerModel;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class NullableModelValueClientTest {

    private final NullableModelValueClient client = new ArrayClientBuilder().buildNullableModelValueClient();

    @Test
    public void get() {
        List<InnerModel> response = client.get();
        assertEquals(3, response.size());
        assertEquals("hello", response.get(0).getProperty());
        Assertions.assertNull(response.get(1));
        assertEquals("world", response.get(2).getProperty());
    }

    @Test
    public void put() {
        List<InnerModel> body = Arrays.asList(
                new InnerModel("hello"), null, new InnerModel("world"));
        client.put(body);
    }
}