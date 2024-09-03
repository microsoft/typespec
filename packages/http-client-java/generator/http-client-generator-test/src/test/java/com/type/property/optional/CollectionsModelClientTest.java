// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.optional;

import com.type.property.optional.models.CollectionsModelProperty;
import com.type.property.optional.models.StringProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

class CollectionsModelClientTest {

    CollectionsModelClient client = new OptionalClientBuilder().buildCollectionsModelClient();

    @Test
    void getAll() {
        CollectionsModelProperty collectionsModelProperty = client.getAll();
        List<StringProperty> properties = collectionsModelProperty.getProperty();
        Assertions.assertEquals("hello", properties.get(0).getProperty());
        Assertions.assertEquals("world", properties.get(1).getProperty());
    }

    @Test
    void getDefault() {
        CollectionsModelProperty collectionsModelProperty = client.getDefault();
        Assertions.assertNull(collectionsModelProperty.getProperty());
    }

    @Test
    void putAll() {
        CollectionsModelProperty collectionsModelProperty = new CollectionsModelProperty();
        StringProperty stringProperty1 = new StringProperty();
        StringProperty stringProperty2 = new StringProperty();
        stringProperty1.setProperty("hello");
        stringProperty2.setProperty("world");
        collectionsModelProperty.setProperty(Arrays.asList(stringProperty1, stringProperty2));
        client.putAll(collectionsModelProperty);
    }

    @Test
    void putDefault() {
        CollectionsModelProperty collectionsModelProperty = new CollectionsModelProperty();
        client.putDefault(collectionsModelProperty);
    }
}