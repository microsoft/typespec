// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.dictionary;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

public class BooleanValueTests {

    private final BooleanValueClient client = new DictionaryClientBuilder().buildBooleanValueClient();
    private final Map<String, Boolean> expected = new HashMap<>();
    {
        expected.put("k1", true);
        expected.put("k2", false);
    }

    @Test
    public void testBooleanGet() {
        Map<String, Boolean> response = client.get();
        Assertions.assertEquals(expected, response);
    }

    @Test
    public void testBooleanPut() {
        client.put(expected);
    }
}
