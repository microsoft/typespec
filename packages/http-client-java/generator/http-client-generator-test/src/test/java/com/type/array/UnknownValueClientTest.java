// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.array;

import java.util.Arrays;
import java.util.List;

import com.azure.core.util.BinaryData;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class UnknownValueClientTest {

    private final UnknownValueClient client = new ArrayClientBuilder().buildUnknownValueClient();

    // BinaryData case, when use-object-for-unknown=false
//    @Disabled("TODO https://github.com/Azure/autorest.java/issues/2964")
//    @Test
//    public void get() {
//        List<BinaryData> response = client.get();
//        Assertions.assertEquals(3, response.size());
//        Assertions.assertEquals(1, response.get(0).toObject(Integer.class));
//        Assertions.assertEquals("hello", response.get(1).toObject(String.class));
//        Assertions.assertEquals(null, response.get(2));
//    }
//
//    @Test
//    public void put() {
//        client.put(Arrays.asList(
//          BinaryData.fromObject(1),
//          BinaryData.fromObject("hello"), null));
//    }

    @Test
    public void get() {
        List<Object> response = client.get();
        Assertions.assertEquals(3, response.size());
        Assertions.assertEquals(1, response.get(0));
        Assertions.assertEquals("hello", response.get(1));
        Assertions.assertEquals(null, response.get(2));
    }

    @Test
    public void put() {
        client.put(Arrays.asList(1, "hello", null));
    }
}
