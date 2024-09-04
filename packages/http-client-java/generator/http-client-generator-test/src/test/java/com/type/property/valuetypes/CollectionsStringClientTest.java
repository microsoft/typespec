// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.valuetypes;

import com.type.property.valuetypes.models.CollectionsStringProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

class CollectionsStringClientTest {

    CollectionsStringClient client = new ValueTypesClientBuilder().buildCollectionsStringClient();

    @Test
    void get() {
        CollectionsStringProperty collectionsStringProperty = client.get();
        System.out.println(collectionsStringProperty);
        Assertions.assertEquals("hello", collectionsStringProperty.getProperty().get(0));
        Assertions.assertEquals("world", collectionsStringProperty.getProperty().get(1));
    }

    @Test
    void put() {
        CollectionsStringProperty collectionsStringProperty = new CollectionsStringProperty(Arrays.asList("hello", "world"));
        client.put(collectionsStringProperty);
    }
}