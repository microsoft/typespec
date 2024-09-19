// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.optional;

import com.type.property.optional.models.CollectionsByteProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

class CollectionsByteClientTest {

    CollectionsByteClient client = new OptionalClientBuilder().buildCollectionsByteClient();

    @Test
    void getAll() {
        CollectionsByteProperty collectionsByteProperty = client.getAll();
        for (byte[] p : collectionsByteProperty.getProperty()) {
            Assertions.assertNotNull(p);
        }
    }

    @Test
    void getDefault() {
        CollectionsByteProperty collectionsByteProperty = client.getDefault();
        Assertions.assertNull(collectionsByteProperty.getProperty());
    }

    @Test
    void putAll() {
        CollectionsByteProperty collectionsByteProperty = new CollectionsByteProperty();
        byte[] byteProperty = new byte[]{104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33};
        collectionsByteProperty.setProperty(Arrays.asList(byteProperty, byteProperty));
        client.putAll(collectionsByteProperty);
    }

    @Test
    void putDefault() {
        CollectionsByteProperty collectionsByteProperty = new CollectionsByteProperty();
        client.putDefault(collectionsByteProperty);
    }
}