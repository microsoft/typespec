// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.nullable;

import com.type.property.nullable.models.CollectionsModelProperty;
import com.type.property.nullable.models.InnerModel;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class CollectionsModelClientTest {

    CollectionsModelClient client = new NullableClientBuilder().buildCollectionsModelClient();

    @Test
    void patchNonNullWithResponse() {
        CollectionsModelProperty property = new CollectionsModelProperty().setRequiredProperty("foo").setNullableProperty(Arrays.asList(new InnerModel().setProperty("hello"), new InnerModel().setProperty("world")));
        client.patchNonNull(property);
    }

    @Test
    void patchNullWithResponse() {
        client.patchNull(new CollectionsModelProperty().setRequiredProperty("foo").setNullableProperty(null));
    }

    @Test
    void getNonNull() {
        CollectionsModelProperty response = client.getNonNull();
        assertNotNull(response.getNullableProperty());
    }

    @Test
    void getNull() {
        CollectionsModelProperty response = client.getNull();
        assertNull(response.getNullableProperty());
    }
}