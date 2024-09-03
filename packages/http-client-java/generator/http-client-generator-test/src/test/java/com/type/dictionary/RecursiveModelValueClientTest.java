// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.dictionary;

import com.type.dictionary.models.InnerModel;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

class RecursiveModelValueClientTest {

    RecursiveModelValueClient client = new DictionaryClientBuilder().buildRecursiveModelValueClient();

    @Test
    void get() {
        Map<String, InnerModel> response = client.get();
        Assertions.assertTrue(response.containsKey("k1"));
        InnerModel innerModel1 = response.get("k1");
        Assertions.assertEquals("hello", innerModel1.getProperty());
        Assertions.assertEquals(new HashMap<>(), innerModel1.getChildren());

        Assertions.assertTrue(response.containsKey("k2"));
        InnerModel innerModel2 = response.get("k2");
        Assertions.assertEquals("world", innerModel2.getProperty());
        Assertions.assertEquals("inner world", innerModel2.getChildren().get("k2.1").getProperty());
    }

    @Test
    void put() {
        Map<String, InnerModel> map = new HashMap<>();
        InnerModel innerModel1 = new InnerModel("hello");
        innerModel1.setChildren(new HashMap<>());
        map.put("k1", innerModel1);
        InnerModel innerModel2 = new InnerModel("world");
        Map<String, InnerModel> children = new HashMap<>();
        children.put("k2.1", new InnerModel("inner world"));
        innerModel2.setChildren(children);
        map.put("k2", innerModel2);
        client.put(map);
    }
}