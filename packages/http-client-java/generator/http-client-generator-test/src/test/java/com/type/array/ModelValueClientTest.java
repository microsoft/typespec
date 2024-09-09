// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.type.array;

import com.type.array.models.InnerModel;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

class ModelValueClientTest {

    ModelValueClient client = new ArrayClientBuilder().buildModelValueClient();

    @Test
    void get() {
        List<InnerModel> response = client.get();
        Assertions.assertEquals(2, response.size());
        Assertions.assertEquals("hello", response.get(0).getProperty());
        Assertions.assertEquals("world", response.get(1).getProperty());
    }

    @Test
    void put() {
        InnerModel model1 = new InnerModel("hello");
        InnerModel model2 = new InnerModel("world");
        client.put(Arrays.asList(model1, model2));
    }
}