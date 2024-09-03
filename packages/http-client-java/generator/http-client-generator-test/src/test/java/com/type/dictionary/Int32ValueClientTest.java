// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.dictionary;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

class Int32ValueClientTest {

    Int32ValueClient client = new DictionaryClientBuilder().buildInt32ValueClient();

    @Test
    void get() {
        Map<String, Integer> response = client.get();
        Assertions.assertTrue(response.containsKey("k1"));
        Assertions.assertEquals(1, response.get("k1"));
        Assertions.assertTrue(response.containsKey("k2"));
        Assertions.assertEquals(2, response.get("k2"));
    }

    @Test
    void put() {
        Map<String, Integer> map = new HashMap<>();
        map.put("k1", 1);
        map.put("k2", 2);
        client.put(map);
    }
}