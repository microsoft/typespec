// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.dictionary;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

class DatetimeValueClientTest {

    DatetimeValueClient client = new DictionaryClientBuilder().buildDatetimeValueClient();

    @Test
    void get() {
        Map<String, OffsetDateTime> response = client.get();
        Assertions.assertTrue(response.containsKey("k1"));
        Assertions.assertEquals(OffsetDateTime.parse("2022-08-26T18:38Z"), response.get("k1"));
    }

    @Test
    void put() {
        Map<String, OffsetDateTime> map = new HashMap<>();
        map.put("k1", OffsetDateTime.parse("2022-08-26T18:38Z"));
        client.put(map);
    }
}