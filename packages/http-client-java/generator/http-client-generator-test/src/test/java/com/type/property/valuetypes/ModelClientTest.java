// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.property.valuetypes;

import com.type.property.valuetypes.models.InnerModel;
import com.type.property.valuetypes.models.ModelProperty;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class ModelClientTest {

    ModelClient client = new ValueTypesClientBuilder().buildModelClient();

    @Test
    void get() {
        ModelProperty modelProperty = client.get();
        Assertions.assertEquals("hello", modelProperty.getProperty().getProperty());
    }

    @Test
    void put() {
        InnerModel innerModel = new InnerModel("hello");
        ModelProperty modelProperty = new ModelProperty(innerModel);
        client.put(modelProperty);
    }
}