// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.dictionary;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

class StringValueClientTest {

    StringValueClient client = new DictionaryClientBuilder().buildStringValueClient();

    @Test
    void get() {
        Map<String, String> response = client.get();
        Assertions.assertEquals("hello", response.get("k1"));
        Assertions.assertEquals("", response.get("k2"));
    }

    @Test
    void put() {
        Map<String, String> map = new HashMap<>();
        map.put("k1", "hello");
        map.put("k2", "");
        client.put(map);
    }
}