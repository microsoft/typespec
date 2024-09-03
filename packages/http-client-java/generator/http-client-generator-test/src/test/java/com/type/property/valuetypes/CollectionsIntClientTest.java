// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.valuetypes;

import com.type.property.valuetypes.models.CollectionsIntProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

class CollectionsIntClientTest {

    CollectionsIntClient client = new ValueTypesClientBuilder().buildCollectionsIntClient();

    @Test
    void get() {
        CollectionsIntProperty collectionsIntProperty = client.get();
        List<Integer> properties = collectionsIntProperty.getProperty();
        Assertions.assertEquals(1, properties.get(0));
        Assertions.assertEquals(2, properties.get(1));
    }

    @Test
    void put() {
        CollectionsIntProperty collectionsIntProperty = new CollectionsIntProperty(Arrays.asList(1, 2));
        client.put(collectionsIntProperty);
    }
}