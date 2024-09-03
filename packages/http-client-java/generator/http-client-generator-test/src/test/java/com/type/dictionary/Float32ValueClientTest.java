// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.dictionary;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

class Float32ValueClientTest {

    Float32ValueClient client = new DictionaryClientBuilder().buildFloat32ValueClient();

    @Test
    void get() {
        Map<String, Double> response = client.get();
        Assertions.assertTrue(response.containsKey("k1"));
        Assertions.assertEquals(43.125, response.get("k1"));
    }

    @Test
    void put() {
        Map<String, Double> map = new HashMap<>();
        map.put("k1", 43.125);
        client.put(map);
    }
}