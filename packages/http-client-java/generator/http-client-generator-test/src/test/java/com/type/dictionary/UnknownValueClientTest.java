// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.dictionary;

import com.azure.core.util.BinaryData;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;

public class UnknownValueClientTest {

    public final UnknownValueClient client = new DictionaryClientBuilder().buildUnknownValueClient();

    // BinaryData case, when use-object-for-unknown=false
//    @Disabled("TODO https://github.com/Azure/autorest.java/issues/2964")
//    @Test
//    public void get() {
//        Map<String, BinaryData> response = client.get();
//        Assertions.assertEquals(1, response.get("k1").toObject(Integer.class));
//        Assertions.assertEquals("hello", response.get("k2").toObject(String.class));
//        Assertions.assertEquals(null, response.get("k3"));
//    }
//
//    @Test
//    public void putWithResponse() {
//        ObjectNode map = JsonNodeFactory.instance.objectNode();
//        map.put("k1", 1);
//        map.put("k2", "hello");
//        map.set("k3", NullNode.instance);
//        client.putWithResponse(BinaryData.fromObject(map), null);
//    }

    @Test
    public void get() {
        Map<String, Object> response = client.get();
        Assertions.assertEquals(1, response.get("k1"));
        Assertions.assertEquals("hello", response.get("k2"));
        Assertions.assertEquals(null, response.get("k3"));
    }

    @Test
    public void putWithResponse() {
        ObjectNode map = JsonNodeFactory.instance.objectNode();
        map.put("k1", 1);
        map.put("k2", "hello");
        map.set("k3", NullNode.instance);
        client.putWithResponse(BinaryData.fromObject(map), null);
    }
}
